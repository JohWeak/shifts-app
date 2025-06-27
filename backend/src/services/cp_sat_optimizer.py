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
            # Shifts on different days
            if shift1_end > 24:  # Night shift extends to next day
                shift1_end -= 24
                rest_hours = shift2_start - shift1_end
            else:
                rest_hours = (24 - shift1_end) + shift2_start
        else:
            # Shifts on same day
            rest_hours = shift2_start - shift1_end

        return rest_hours

    def optimize_schedule(self, data):
        """Universal schedule optimization with configurable constraints"""
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

        # Hard constraints (law)
        max_hours_per_day = hard_constraints.get('max_hours_per_day', 12)
        min_rest_between_shifts = hard_constraints.get('min_rest_between_shifts', 11)
        max_night_shifts_per_week = hard_constraints.get('max_night_shifts_per_week', 3)

        # Soft constraints (admin settings)
        max_shifts_per_day = soft_constraints.get('max_shifts_per_day', 1)
        max_consecutive_work_days = soft_constraints.get('max_consecutive_work_days', 6)
        max_hours_per_week = soft_constraints.get('max_hours_per_week', 48)

        # Constraints on "cannot work" and "prefer work" days
        max_cannot_work_days = settings.get('max_cannot_work_days_per_week', 2)
        max_prefer_work_days = settings.get('max_prefer_work_days_per_week', 3)

        print(f"[Universal CP-SAT] Configuration:")
        print(f"  - Max {max_hours_per_day}h/day, min {min_rest_between_shifts}h rest")
        print(f"  - Max {max_shifts_per_day} shifts/day, {max_consecutive_work_days} consecutive days")
        print(f"  - Max cannot-work days: {max_cannot_work_days}, prefer-work days: {max_prefer_work_days}")

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

        # 1. POSITION COVERAGE CONSTRAINTS (with admin settings)
        shortage_vars = []
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        # Only employees with matching position
                        if emp.get('default_position_id') == position['pos_id']:
                            assignment_vars.append(
                                assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                            )

                    # Admin can configure number of employees per shift
                    required_employees = position.get('num_of_emp', 1)

                    # Shortage variable
                    shortage_var = self.model.NewIntVar(0, required_employees,
                                                        f"shortage_{day_idx}_{shift['shift_id']}_{position['pos_id']}")
                    shortage_vars.append(shortage_var)

                    # Flexible constraint
                    self.model.Add(sum(assignment_vars) + shortage_var == required_employees)

        # 2. HARD CONSTRAINTS (LAW)

        # 2.1 Maximum hours per day
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
                            # Account for actual shift duration
                            day_hours.append(assignment_var * shift['duration'])

                # Hard constraint on hours
                self.model.Add(sum(day_hours) <= max_hours_per_day)

                # Soft constraint on number of shifts
                self.model.Add(sum(day_assignments) <= max_shifts_per_day)

        # 2.2 Minimum rest between shifts on same day
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                for i, shift1 in enumerate(shifts):
                    for j, shift2 in enumerate(shifts):
                        if i < j:  # Only for different shifts
                            rest_hours = self._calculate_rest_hours(shift1, shift2, False)

                            if rest_hours < min_rest_between_shifts:
                                # Prohibit working both shifts
                                for position in positions:
                                    if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                            (emp_id, day_idx, shift2['shift_id'], position['pos_id']) in assignments):
                                        self.model.Add(
                                            assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                            assignments[(emp_id, day_idx, shift2['shift_id'], position['pos_id'])] <= 1
                                        )

        # 2.3 Minimum rest between shifts on different days
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days) - 1):
                # Check all shift combinations between days
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

        # 3. EMPLOYEE CONSTRAINTS

        # 3.1 Cannot work constraints
        for constraint in constraints['cannot_work']:
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']

            # Employee cannot work any shift on this day
            for shift in shifts:
                for position in positions:
                    if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                        self.model.Add(
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0
                        )

        # 4. SOFT CONSTRAINTS

        # 4.1 Maximum consecutive work days
        for emp in employees:
            emp_id = emp['emp_id']
            for start_day in range(len(days) - max_consecutive_work_days):
                consecutive_vars = []
                for day_offset in range(max_consecutive_work_days + 1):
                    day_idx = start_day + day_offset
                    day_worked = self.model.NewBoolVar(f"worked_{emp_id}_{day_idx}")

                    # Day is worked if any shift is assigned
                    shift_vars = []
                    for shift in shifts:
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                shift_vars.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])])

                    if shift_vars:
                        self.model.AddMaxEquality(day_worked, shift_vars)
                        consecutive_vars.append(day_worked)

                # Limit consecutive days
                if consecutive_vars:
                    self.model.Add(sum(consecutive_vars) <= max_consecutive_work_days)

        # 5. OPTIMIZATION OBJECTIVE
        objective_terms = []

        # 5.1 Minimize shortage (highest priority)
        shortage_weight = optimization_weights.get('shortage_penalty', 1000)
        for shortage_var in shortage_vars:
            objective_terms.append(shortage_var * -shortage_weight)

        # 5.2 Prefer work constraints
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

        # 5.3 Balance workload
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

        # Minimize difference between max and min workload
        if len(total_shifts_vars) > 1:
            max_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'max_shifts')
            min_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'min_shifts')

            self.model.AddMaxEquality(max_shifts, total_shifts_vars)
            self.model.AddMinEquality(min_shifts, total_shifts_vars)

            balance_var = self.model.NewIntVar(0, len(days) * len(shifts), 'balance')
            self.model.Add(balance_var == max_shifts - min_shifts)
            objective_terms.append(balance_var * -workload_balance_weight)

        # Set objective function
        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        # 6. SOLVE
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
                'consecutive_days_violations': 0,
                'rest_violations': 0
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

            # Calculate shortage
            for shortage_var in shortage_vars:
                stats['total_shortage'] += self.solver.Value(shortage_var)

            return {
                'success': True,
                'schedule': schedule,
                'stats': stats,
                'status': 'optimal' if status == cp_model.OPTIMAL else 'feasible',
                'solve_time': self.solver.WallTime() * 1000,  # Convert to ms
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
        # Load data
        with open(args.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Create scheduler and optimize
        scheduler = UniversalShiftSchedulerCP()
        result = scheduler.optimize_schedule(data)

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)