# backend/src/services/cp_sat_optimizer.py
from ortools.sat.python import cp_model
import json
import sys
import argparse
from datetime import datetime, timedelta

class UniversalShiftSchedulerCP:
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def _parse_time(self, time_str):
        """Convert time format HH:MM:SS to hours"""
        parts = time_str.split(':')
        return int(parts[0]) + int(parts[1]) / 60

    def _calculate_rest_hours(self, shift1, shift2, is_next_day=False):
        """Calculate rest hours between two shifts"""
        shift1_end = self._parse_time(shift1['start_time']) + shift1['duration']
        shift2_start = self._parse_time(shift2['start_time'])

        if is_next_day:
            if shift1_end > 24:
                shift1_end -= 24
                rest_hours = shift2_start - shift1_end
            else:
                rest_hours = (24 - shift1_end) + shift2_start
        else:
            rest_hours = shift2_start - shift1_end

        return rest_hours

    def optimize_schedule(self, data):
        """Universal schedule optimization with permanent constraints support"""
        print(f"[Universal CP-SAT] Starting optimization...")

        # Extract data
        employees = data['employees']
        shifts = data['shifts']
        positions = data['positions']
        days = data['days']
        constraints = data['constraints']
        settings = data.get('settings', {})

        # Get constraints from configuration
        hard_constraints = settings.get('hard_constraints', {})
        soft_constraints = settings.get('soft_constraints', {})
        optimization_weights = settings.get('optimization_weights', {})

        # Extract permanent constraints
        permanent_cannot_work = constraints.get('permanent_cannot_work', [])
        legal_constraints = constraints.get('legal_constraints', [])

        print(f"[Universal CP-SAT] Permanent constraints: {len(permanent_cannot_work)}")
        print(f"[Universal CP-SAT] Legal constraints: {len(legal_constraints)}")

        # Hard constraints (law)
        max_hours_per_day = hard_constraints.get('max_hours_per_day', 12)
        min_rest_between_shifts = hard_constraints.get('min_rest_between_shifts', 11)
        max_night_shifts_per_week = hard_constraints.get('max_night_shifts_per_week', 3)

        # Soft constraints (admin settings)
        max_shifts_per_day = soft_constraints.get('max_shifts_per_day', 1)
        max_consecutive_work_days = soft_constraints.get('max_consecutive_work_days', 6)
        max_hours_per_week = soft_constraints.get('max_hours_per_week', 48)

        print(f"[Universal CP-SAT] Configuration:")
        print(f"  - Max {max_hours_per_day}h/day, min {min_rest_between_shifts}h rest")
        print(f"  - Max {max_shifts_per_day} shifts/day, {max_consecutive_work_days} consecutive days")

        # Create decision variables
        assignments = {}
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx, day in enumerate(days):
                for shift in shifts:
                    for position in positions:
                        var_name = f"assign_{emp_id}_{day_idx}_{shift['shift_id']}_{position['pos_id']}"
                        assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] = \
                            self.model.NewBoolVar(var_name)

        # 1. APPLY PERMANENT CONSTRAINTS FIRST (highest priority)
        for perm_constraint in permanent_cannot_work:
            emp_id = perm_constraint['emp_id']
            day_idx = perm_constraint['day_index']
            shift_id = perm_constraint.get('shift_id')

            print(f"[Universal CP-SAT] Applying permanent constraint: emp {emp_id}, day {day_idx}, shift {shift_id}")

            if shift_id:
                # Specific shift constraint
                for position in positions:
                    key = (emp_id, day_idx, shift_id, position['pos_id'])
                    if key in assignments:
                        self.model.Add(assignments[key] == 0)
            else:
                # All shifts constraint
                for shift in shifts:
                    for position in positions:
                        key = (emp_id, day_idx, shift['shift_id'], position['pos_id'])
                        if key in assignments:
                            self.model.Add(assignments[key] == 0)

        # 2. POSITION COVERAGE CONSTRAINTS
        shortage_vars = []
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        if emp.get('default_position_id') == position['pos_id']:
                            assignment_vars.append(
                                assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                            )

                    required_employees = position.get('num_of_emp', 1)
                    shortage_var = self.model.NewIntVar(0, required_employees,
                                                        f"shortage_{day_idx}_{shift['shift_id']}_{position['pos_id']}")
                    shortage_vars.append(shortage_var)
                    self.model.Add(sum(assignment_vars) + shortage_var == required_employees)

        # 3. HARD CONSTRAINTS (LAW) - including legal constraints

        # 3.1 Maximum hours per day
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                day_hours = []
                day_assignments = []

                for shift in shifts:
                    for position in positions:
                        if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                            assignment_var = assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                            day_assignments.append(assignment_var)
                            day_hours.append(assignment_var * shift['duration'])

                self.model.Add(sum(day_hours) <= max_hours_per_day)
                self.model.Add(sum(day_assignments) <= max_shifts_per_day)

        # 3.2 Minimum rest between shifts
        for emp in employees:
            emp_id = emp['emp_id']

            # Same day shifts
            for day_idx in range(len(days)):
                for i, shift1 in enumerate(shifts):
                    for j, shift2 in enumerate(shifts):
                        if i < j:
                            rest_hours = self._calculate_rest_hours(shift1, shift2, False)
                            if rest_hours < min_rest_between_shifts:
                                for position in positions:
                                    if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                            (emp_id, day_idx, shift2['shift_id'], position['pos_id']) in assignments):
                                        self.model.Add(
                                            assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                            assignments[(emp_id, day_idx, shift2['shift_id'], position['pos_id'])] <= 1
                                        )

            # Different days shifts
            for day_idx in range(len(days) - 1):
                for shift1 in shifts:
                    for shift2 in shifts:
                        rest_hours = self._calculate_rest_hours(shift1, shift2, True)
                        if rest_hours < min_rest_between_shifts:
                            for position in positions:
                                if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                        (emp_id, day_idx + 1, shift2['shift_id'], position['pos_id']) in assignments):
                                    self.model.Add(
                                        assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                        assignments[(emp_id, day_idx + 1, shift2['shift_id'], position['pos_id'])] <= 1
                                    )

        # 4. TEMPORARY EMPLOYEE CONSTRAINTS
        for constraint in constraints['cannot_work']:
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']

            for shift in shifts:
                for position in positions:
                    if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                        self.model.Add(
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0
                        )

        # 5. SOFT CONSTRAINTS - Maximum consecutive work days
        for emp in employees:
            emp_id = emp['emp_id']
            for start_day in range(len(days) - max_consecutive_work_days):
                consecutive_vars = []
                for day_offset in range(max_consecutive_work_days + 1):
                    day_idx = start_day + day_offset
                    day_worked = self.model.NewBoolVar(f"worked_{emp_id}_{day_idx}")

                    shift_vars = []
                    for shift in shifts:
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                shift_vars.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])])

                    if shift_vars:
                        self.model.AddMaxEquality(day_worked, shift_vars)
                        consecutive_vars.append(day_worked)

                if consecutive_vars:
                    self.model.Add(sum(consecutive_vars) <= max_consecutive_work_days)

        # 6. OPTIMIZATION OBJECTIVE
        objective_terms = []

        # 6.1 Minimize shortage (highest priority)
        shortage_weight = optimization_weights.get('shortage_penalty', 1000)
        for shortage_var in shortage_vars:
            objective_terms.append(shortage_var * -shortage_weight)

        # 6.2 Prefer work constraints
        prefer_weight = optimization_weights.get('prefer_work_bonus', 10)
        for constraint in constraints['prefer_work']:
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']

            for shift in shifts:
                for position in positions:
                    if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                        objective_terms.append(
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] * prefer_weight
                        )

        # 6.3 Balance workload
        workload_balance_weight = optimization_weights.get('workload_balance', 5)
        total_shifts_vars = []

        for emp in employees:
            emp_id = emp['emp_id']
            emp_shifts = []

            for day_idx in range(len(days)):
                for shift in shifts:
                    for position in positions:
                        if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                            emp_shifts.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])])

            if emp_shifts:
                total_var = self.model.NewIntVar(0, len(days) * len(shifts), f'total_shifts_{emp_id}')
                self.model.Add(sum(emp_shifts) == total_var)
                total_shifts_vars.append(total_var)

        if len(total_shifts_vars) > 1:
            max_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'max_shifts')
            min_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'min_shifts')

            self.model.AddMaxEquality(max_shifts, total_shifts_vars)
            self.model.AddMinEquality(min_shifts, total_shifts_vars)

            balance_var = self.model.NewIntVar(0, len(days) * len(shifts), 'balance')
            self.model.Add(balance_var == max_shifts - min_shifts)
            objective_terms.append(balance_var * -workload_balance_weight)

        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        # 7. SOLVE
        self.solver.parameters.max_time_in_seconds = settings.get('max_solve_time', 120.0)
        print(f"[Universal CP-SAT] Starting solver with {len(objective_terms)} objective terms...")
        status = self.solver.Solve(self.model)

        print(f"[Universal CP-SAT] Solver finished with status: {status}")

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Extract results
            schedule = []
            stats = {
                'total_assignments': 0,
                'total_shortage': 0,
                'position_matches': 0,
                'hours_per_employee': {},
                'shifts_per_employee': {},
                'permanent_constraints_respected': len(permanent_cannot_work)
            }

            assignment_index = 0
            for emp in employees:
                emp_id = emp['emp_id']
                emp_hours = 0
                emp_shifts = 0

                for day_idx, day in enumerate(days):
                    for shift in shifts:
                        for position in positions:
                            key = (emp_id, day_idx, shift['shift_id'], position['pos_id'])
                            if key in assignments and self.solver.Value(assignments[key]) == 1:
                                schedule.append({
                                    'emp_id': emp_id,
                                    'date': day['date'],
                                    'shift_id': shift['shift_id'],
                                    'position_id': position['pos_id'],
                                    'assignment_index': assignment_index
                                })
                                assignment_index += 1
                                stats['total_assignments'] += 1
                                emp_hours += shift['duration']
                                emp_shifts += 1

                                if emp.get('default_position_id') == position['pos_id']:
                                    stats['position_matches'] += 1

                if emp_shifts > 0:
                    stats['hours_per_employee'][emp_id] = emp_hours
                    stats['shifts_per_employee'][emp_id] = emp_shifts

            for shortage_var in shortage_vars:
                stats['total_shortage'] += self.solver.Value(shortage_var)

            return {
                'success': True,
                'schedule': schedule,
                'stats': stats,
                'status': 'optimal' if status == cp_model.OPTIMAL else 'feasible',
                'solve_time': self.solver.WallTime() * 1000,
                'coverage_rate': (1 - stats['total_shortage'] / max(1, len(shortage_vars))) * 100,
                'shortage_count': stats['total_shortage']
            }
        else:
            return {
                'success': False,
                'error': f'No solution found. Status: {status}',
                'status': str(status)
            }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('data_file', help='Path to JSON data file')
    args = parser.parse_args()

    try:
        with open(args.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        scheduler = UniversalShiftSchedulerCP()
        result = scheduler.optimize_schedule(data)

        result_file = args.data_file.replace('.json', '_result.json')
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)

        print(json.dumps({"success": True, "result_file": result_file}))

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)