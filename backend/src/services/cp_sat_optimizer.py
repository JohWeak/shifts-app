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
        """Universal schedule optimization with all constraints support"""
        print(f"[Universal CP-SAT] Starting optimization...")

        # Extract data
        employees = data['employees']
        shifts = data['shifts']
        positions = data['positions']
        days = data['days']
        constraints = data['constraints']
        settings = data.get('settings', {})
        # Extract position-shift mapping
        position_shifts_map = data.get('position_shifts_map', {})

        # Get constraints from configuration with UPPERCASE keys
        hard_constraints = settings.get('hard_constraints', {})
        soft_constraints = settings.get('soft_constraints', {})
        optimization_weights = settings.get('optimization_weights', {})

        # Extract all constraint types
        permanent_cannot_work = constraints.get('permanent_cannot_work', [])
        temporary_cannot_work = constraints.get('cannot_work', [])
        prefer_work = constraints.get('prefer_work', [])
        legal_constraints = constraints.get('legal_constraints', [])

        print(f"[Universal CP-SAT] Constraints loaded:")
        print(f"  - Permanent cannot work: {len(permanent_cannot_work)}")
        print(f"  - Temporary cannot work: {len(temporary_cannot_work)}")
        print(f"  - Prefer work: {len(prefer_work)}")
        print(f"  - Legal constraints: {len(legal_constraints)}")

        # Hard constraints (law) - READ WITH UPPERCASE KEYS
        max_hours_per_day = hard_constraints.get('MAX_HOURS_PER_DAY', 12)
        max_hours_per_week = hard_constraints.get('MAX_HOURS_PER_WEEK', 48)
        min_rest_between_shifts = hard_constraints.get('MIN_REST_BETWEEN_SHIFTS', 11)
        min_rest_after_night = hard_constraints.get('MIN_REST_AFTER_NIGHT_SHIFT', 12)
        min_rest_after_regular = hard_constraints.get('MIN_REST_AFTER_REGULAR_SHIFT', 11)
        max_night_shifts_per_week = hard_constraints.get('MAX_NIGHT_SHIFTS_PER_WEEK', 3)

        # Soft constraints (admin settings) - READ WITH UPPERCASE KEYS
        max_shifts_per_day = soft_constraints.get('MAX_SHIFTS_PER_DAY', 1)
        max_consecutive_work_days = soft_constraints.get('MAX_CONSECUTIVE_WORK_DAYS', 6)
        max_cannot_work_days = soft_constraints.get('MAX_CANNOT_WORK_DAYS_PER_WEEK', 2)
        max_prefer_work_days = soft_constraints.get('MAX_PREFER_WORK_DAYS_PER_WEEK', 3)

        # Optimization weights - READ WITH UPPERCASE KEYS
        shortage_penalty = optimization_weights.get('SHORTAGE_PENALTY', 1000)
        prefer_work_bonus = optimization_weights.get('PREFER_WORK_BONUS', 10)
        workload_balance_weight = optimization_weights.get('WORKLOAD_BALANCE', 5)
        position_match_bonus = optimization_weights.get('POSITION_MATCH_BONUS', 20)
        site_match_bonus = optimization_weights.get('SITE_MATCH_BONUS', 10)
        excess_assignment_penalty = optimization_weights.get('EXCESS_ASSIGNMENT_PENALTY', 100)

        print(f"[Universal CP-SAT] Configuration from constants:")
        print(f"  - Max {max_hours_per_day}h/day, min {min_rest_between_shifts}h rest")
        print(f"  - Max {max_shifts_per_day} shifts/day, {max_consecutive_work_days} consecutive days")
        print(f"  - Shortage penalty: {shortage_penalty}, Prefer work bonus: {prefer_work_bonus}")

        # Initialize objective terms list EARLY
        objective_terms = []

        # Create decision variables
        assignments = {}
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx, day in enumerate(days):
                for position in positions:
                    pos_id = str(position['pos_id'])  # Convert to string for key matching

                    # Get valid shifts for this position
                    valid_shifts = position_shifts_map.get(pos_id, [])

                    for shift in shifts:
                        # Only create variable if this shift belongs to this position
                        if shift['shift_id'] in valid_shifts:
                            var_name = f"assign_{emp_id}_{day_idx}_{shift['shift_id']}_{position['pos_id']}"
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] = \
                                self.model.NewBoolVar(var_name)

        print(f"[CP-SAT] Created {len(assignments)} assignment variables")

        # 1. APPLY ALL CONSTRAINTS IN ORDER OF PRIORITY

        # 1.1 PERMANENT CONSTRAINTS (highest priority - absolutely cannot be violated)
        applied_permanent = 0
        blocked_assignments = set()  # Track what we've blocked

        for perm_constraint in permanent_cannot_work:
            emp_id = perm_constraint['emp_id']
            day_idx = perm_constraint['day_index']
            shift_id = perm_constraint.get('shift_id')

            print(f"[CP-SAT] Applying permanent constraint: emp={emp_id}, day={day_idx}, shift={shift_id}")

            # Find employee's position
            emp = next((e for e in employees if e['emp_id'] == emp_id), None)
            if not emp:
                continue

            emp_position_id = emp.get('default_position_id')

            if shift_id is not None:
                # Specific shift constraint - block only this shift
                key = (emp_id, day_idx, shift_id, emp_position_id)
                if key in assignments:
                    self.model.Add(assignments[key] == 0)
                    blocked_assignments.add(key)
                    applied_permanent += 1
                    print(f"[CP-SAT] Blocked: emp {emp_id} on day {day_idx} shift {shift_id}")
            else:
                # All shifts on this day - block ALL shifts for this employee
                blocked_count = 0
                for shift in shifts:
                    key = (emp_id, day_idx, shift['shift_id'], emp_position_id)
                    if key in assignments:
                        self.model.Add(assignments[key] == 0)
                        blocked_assignments.add(key)
                        applied_permanent += 1
                        blocked_count += 1
                print(f"[CP-SAT] Blocked ALL {blocked_count} shifts for emp {emp_id} on day {day_idx}")

        print(f"[Universal CP-SAT] Applied {applied_permanent} permanent constraint variables")
        print(f"[Universal CP-SAT] Total blocked assignments: {len(blocked_assignments)}")

        # 1.2 TEMPORARY CANNOT WORK CONSTRAINTS (second priority)
        applied_temporary = 0
        for constraint in temporary_cannot_work:
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']
            shift_id = constraint.get('shift_id')

            if shift_id is not None:
                # Specific shift constraint
                for position in positions:
                    key = (emp_id, day_idx, shift_id, position['pos_id'])
                    if key in assignments:
                        self.model.Add(assignments[key] == 0)
                        applied_temporary += 1
            else:
                # All shifts on this day
                for shift in shifts:
                    for position in positions:
                        key = (emp_id, day_idx, shift['shift_id'], position['pos_id'])
                        if key in assignments:
                            self.model.Add(assignments[key] == 0)
                            applied_temporary += 1

        print(f"[Universal CP-SAT] Applied {applied_temporary} temporary constraint variables")

        # 2. POSITION COVERAGE CONSTRAINTS (with exact requirements)
        shortage_vars = []
        shift_requirements = data.get('shift_requirements', {})

        for day_idx, day in enumerate(days):
            date_str = day['date']

            for position in positions:
                pos_id = position['pos_id']
                pos_str = str(pos_id)

                # Get valid shifts for this position
                valid_shifts = position_shifts_map.get(pos_str, [])

                for shift_id in valid_shifts:
                    # Find requirement
                    requirement_key = f"{pos_id}-{shift_id}-{date_str}"
                    requirement = shift_requirements.get(requirement_key)

                    if requirement:
                        required_employees = requirement.get('required_staff', 1)
                    else:
                        required_employees = 1

                    print(f"[CP-SAT] Position {pos_id} shift {shift_id} on {date_str}: needs {required_employees} staff")

                    if required_employees > 0:
                        assignment_vars = []

                        # Only employees with matching position can work
                        for emp in employees:
                            if emp.get('default_position_id') == pos_id:
                                key = (emp['emp_id'], day_idx, shift_id, pos_id)
                                if key in assignments:
                                    assignment_vars.append(assignments[key])

                        if assignment_vars:
                            # EXACT constraint to prevent over-assignment
                            if required_employees == 1:
                                # For single employee requirement, use at most 1
                                self.model.Add(sum(assignment_vars) <= 1)

                                # Create shortage var for objective
                                shortage_var = self.model.NewBoolVar(
                                    f"shortage_{day_idx}_{shift_id}_{pos_id}"
                                )
                                self.model.Add(shortage_var == (1 - sum(assignment_vars)))
                                shortage_vars.append(shortage_var)
                            else:
                                # For multiple employees, use exact constraint with shortage/excess tracking
                                actual_assigned = self.model.NewIntVar(
                                    0, len(assignment_vars),
                                    f"actual_{day_idx}_{shift_id}_{pos_id}"
                                )
                                self.model.Add(actual_assigned == sum(assignment_vars))

                                # Shortage variable
                                shortage_var = self.model.NewIntVar(
                                    0, required_employees,
                                    f"shortage_{day_idx}_{shift_id}_{pos_id}"
                                )
                                self.model.AddMaxEquality(
                                    shortage_var,
                                    [0, required_employees - actual_assigned]
                                )
                                shortage_vars.append(shortage_var)

                                # Excess variable (penalize over-assignment)
                                excess_var = self.model.NewIntVar(
                                    0, len(assignment_vars),
                                    f"excess_{day_idx}_{shift_id}_{pos_id}"
                                )
                                self.model.AddMaxEquality(
                                    excess_var,
                                    [0, actual_assigned - required_employees]
                                )
                                # Add penalty for excess assignments
                                objective_terms.append(excess_var * -excess_assignment_penalty)

                            print(f"[CP-SAT] Constraint: {len(assignment_vars)} candidates, {required_employees} required")

        # 3. HARD CONSTRAINTS (LEGAL REQUIREMENTS)

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
                            # Account for actual shift duration
                            day_hours.append(assignment_var * shift['duration'])

                # Hard constraint on hours
                if day_hours:
                    self.model.Add(sum(day_hours) <= max_hours_per_day)

                # Soft constraint on number of shifts (usually 1 per day)
                if day_assignments:
                    self.model.Add(sum(day_assignments) <= max_shifts_per_day)

        # 3.2 Maximum hours per week
        for emp in employees:
            emp_id = emp['emp_id']
            week_hours = []

            for day_idx in range(len(days)):
                for shift in shifts:
                    for position in positions:
                        if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                            assignment_var = assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                            week_hours.append(assignment_var * shift['duration'])

            if week_hours:
                self.model.Add(sum(week_hours) <= max_hours_per_week)

        # 3.3 Minimum rest between shifts on same day
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                for i, shift1 in enumerate(shifts):
                    for j, shift2 in enumerate(shifts):
                        if i < j:  # Only check different shifts
                            rest_hours = self._calculate_rest_hours(shift1, shift2, False)

                            if rest_hours < min_rest_between_shifts:
                                # Cannot work both shifts
                                for position in positions:
                                    if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                            (emp_id, day_idx, shift2['shift_id'], position['pos_id']) in assignments):
                                        self.model.Add(
                                            assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                            assignments[(emp_id, day_idx, shift2['shift_id'], position['pos_id'])] <= 1
                                        )

        # 3.4 Minimum rest between shifts on consecutive days
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days) - 1):
                for shift1 in shifts:
                    for shift2 in shifts:
                        rest_hours = self._calculate_rest_hours(shift1, shift2, True)

                        # Use appropriate rest requirement based on shift type
                        required_rest = min_rest_after_night if shift1.get('is_night_shift', False) else min_rest_after_regular

                        if rest_hours < required_rest:
                            for position in positions:
                                if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                        (emp_id, day_idx + 1, shift2['shift_id'], position['pos_id']) in assignments):
                                    self.model.Add(
                                        assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                        assignments[(emp_id, day_idx + 1, shift2['shift_id'], position['pos_id'])] <= 1
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

        # 4.2 Maximum night shifts per week
        for emp in employees:
            emp_id = emp['emp_id']
            night_shift_vars = []

            for day_idx in range(len(days)):
                for shift in shifts:
                    if shift.get('is_night_shift', False):
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                night_shift_vars.append(
                                    assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                                )

            if night_shift_vars:
                self.model.Add(sum(night_shift_vars) <= max_night_shifts_per_week)

        # 5. OPTIMIZATION OBJECTIVE (using pre-initialized objective_terms)

        # 5.1 Minimize shortage (highest priority)
        for shortage_var in shortage_vars:
            objective_terms.append(shortage_var * -shortage_penalty)

        # 5.2 Prefer work constraints (positive incentive)
        for constraint in prefer_work:
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']
            shift_id = constraint.get('shift_id')

            if shift_id is not None:
                # Specific shift preference
                for position in positions:
                    if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                        objective_terms.append(
                            assignments[(emp_id, day_idx, shift_id, position['pos_id'])] * prefer_work_bonus
                        )
            else:
                # Any shift on this day preference
                for shift in shifts:
                    for position in positions:
                        if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                            objective_terms.append(
                                assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] * prefer_work_bonus
                            )

        # 5.3 Position matching bonus
        for emp in employees:
            emp_id = emp['emp_id']
            default_pos = emp.get('default_position_id')

            if default_pos:
                for day_idx in range(len(days)):
                    for shift in shifts:
                        if (emp_id, day_idx, shift['shift_id'], default_pos) in assignments:
                            objective_terms.append(
                                assignments[(emp_id, day_idx, shift['shift_id'], default_pos)] * position_match_bonus
                            )

        # 5.4 Balance workload
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
        print(f"[Universal CP-SAT] Variables: {len(assignments)}, Constraints: {len(self.model.Proto().constraints)}")

        status = self.solver.Solve(self.model)

        print(f"[Universal CP-SAT] Solver finished with status: {status}")
        print(f"[Universal CP-SAT] Status names: OPTIMAL={cp_model.OPTIMAL}, FEASIBLE={cp_model.FEASIBLE}")

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Extract results
            schedule = []
            stats = {
                'total_assignments': 0,
                'total_shortage': 0,
                'position_matches': 0,
                'hours_per_employee': {},
                'shifts_per_employee': {},
                'permanent_constraints_respected': len(permanent_cannot_work),
                'temporary_constraints_respected': len(temporary_cannot_work),
                'prefer_work_satisfied': 0,
                'objective_value': self.solver.ObjectiveValue()
            }

            # Check prefer work satisfaction
            for constraint in prefer_work:
                emp_id = constraint['emp_id']
                day_idx = constraint['day_index']
                shift_id = constraint.get('shift_id')

                satisfied = False
                if shift_id is not None:
                    for position in positions:
                        key = (emp_id, day_idx, shift_id, position['pos_id'])
                        if key in assignments and self.solver.Value(assignments[key]) == 1:
                            satisfied = True
                            break
                else:
                    for shift in shifts:
                        for position in positions:
                            key = (emp_id, day_idx, shift['shift_id'], position['pos_id'])
                            if key in assignments and self.solver.Value(assignments[key]) == 1:
                                satisfied = True
                                break
                        if satisfied:
                            break

                if satisfied:
                    stats['prefer_work_satisfied'] += 1

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

            print(f"[Universal CP-SAT] Solution found:")
            print(f"  - Assignments: {stats['total_assignments']}")
            print(f"  - Shortage: {stats['total_shortage']}")
            print(f"  - Position matches: {stats['position_matches']}")
            print(f"  - Prefer work satisfied: {stats['prefer_work_satisfied']}/{len(prefer_work)}")

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
                'status': str(status),
                'details': {
                    'variables': len(assignments),
                    'constraints': len(self.model.Proto().constraints),
                    'objective_terms': len(objective_terms)
                }
            }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('data_file', help='Path to JSON data file')
    args = parser.parse_args()

    try:
        # Load data
        with open(args.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Create a scheduler and optimize
        scheduler = UniversalShiftSchedulerCP()
        result = scheduler.optimize_schedule(data)

        # Save result to file
        result_file = args.data_file.replace('.json', '_result.json')
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)

        # Print only success status
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