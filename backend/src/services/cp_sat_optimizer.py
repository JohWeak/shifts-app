# backend/src/services/cp_sat_optimizer.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from ortools.sat.python import cp_model
import json
import sys
import argparse
from datetime import datetime, timedelta

class ShiftSchedulerCP:
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def optimize_schedule(self, data):
        """Оптимизация расписания с использованием CP-SAT"""
        print(f"[CP-SAT Python] Starting optimization...")

        employees = data['employees']
        shifts = data['shifts']
        positions = data['positions']
        days = data['days']
        constraints = data['constraints']
        settings = data['settings']

        print(f"[CP-SAT Python] Data: {len(employees)} employees, {len(shifts)} shifts, {len(positions)} positions")
        print(f"[CP-SAT Python] Constraints: {len(constraints.get('cannot_work', []))} cannot_work, {len(constraints.get('prefer_work', []))} prefer_work")

        # Создание переменных
        assignments = {}
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx, day in enumerate(days):
                for shift in shifts:
                    for position in positions:
                        var_name = f"assign_{emp_id}_{day_idx}_{shift['shift_id']}_{position['pos_id']}"
                        assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] = \
                            self.model.NewBoolVar(var_name)

        # ОСЛАБЛЕННЫЕ ограничения покрытия позиций (минимум, а не точно)
        coverage_vars = []
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        assignment_vars.append(
                            assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                        )

                    # Минимум нужное количество сотрудников (вместо точно)
                    total_assigned = self.model.NewIntVar(0, len(employees), f'coverage_{day_idx}_{shift["shift_id"]}_{position["pos_id"]}')
                    self.model.Add(sum(assignment_vars) == total_assigned)

                    # Мягкое ограничение: стремимся к нужному покрытию
                    target = position['num_of_emp']
                    coverage_penalty = self.model.NewIntVar(0, len(employees), f'penalty_{day_idx}_{shift["shift_id"]}_{position["pos_id"]}')
                    self.model.AddAbsEquality(coverage_penalty, total_assigned - target)
                    coverage_vars.append(coverage_penalty)

        # Ограничения сотрудников (максимум 1 смена в день)
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                daily_assignments = []
                for shift in shifts:
                    for position in positions:
                        daily_assignments.append(
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                        )
                self.model.Add(sum(daily_assignments) <= settings.get('max_shifts_per_day', 1))

        # Ограничения "cannot_work"
        for constraint in constraints.get('cannot_work', []):
            emp_id = constraint['emp_id']
            day_idx = constraint.get('day_index')
            shift_id = constraint.get('shift_id')

            if day_idx is not None and shift_id is not None:
                for position in positions:
                    key = (emp_id, day_idx, shift_id, position['pos_id'])
                    if key in assignments:
                        self.model.Add(assignments[key] == 0)

        # УБИРАЕМ жесткое ограничение в 42 часа
        # Вместо этого добавляем мягкое ограничение с штрафом
        overtime_vars = []
        for emp in employees:
            emp_id = emp['emp_id']
            weekly_hours = []
            for day_idx in range(len(days)):
                for shift in shifts:
                    for position in positions:
                        weekly_hours.append(
                            assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] *
                            shift['duration']
                        )

            total_hours = self.model.NewIntVar(0, 100, f'total_hours_{emp_id}')
            self.model.Add(sum(weekly_hours) == total_hours)

            # Мягкое ограничение: штраф за превышение 48 часов
            overtime = self.model.NewIntVar(0, 100, f'overtime_{emp_id}')
            self.model.AddMaxEquality(overtime, [total_hours - 48, 0])
            overtime_vars.append(overtime)

        # Цель: минимизировать штрафы и максимизировать предпочтения
        objective_terms = []

        # Штраф за плохое покрытие смен
        for penalty in coverage_vars:
            objective_terms.append(penalty * -10)  # Большой штраф

        # Штраф за сверхурочные
        for overtime in overtime_vars:
            objective_terms.append(overtime * -1)  # Небольшой штраф

        # Бонус за удовлетворение предпочтений "prefer_work"
        for constraint in constraints.get('prefer_work', []):
            emp_id = constraint['emp_id']
            day_idx = constraint.get('day_index')
            shift_id = constraint.get('shift_id')

            if day_idx is not None and shift_id is not None:
                for position in positions:
                    key = (emp_id, day_idx, shift_id, position['pos_id'])
                    if key in assignments:
                        objective_terms.append(assignments[key] * 5)  # Бонус

        # Балансировка нагрузки
        total_shifts_vars = []
        for emp in employees:
            emp_id = emp['emp_id']
            emp_total = []
            for day_idx in range(len(days)):
                for shift in shifts:
                    for position in positions:
                        emp_total.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])])

            total_var = self.model.NewIntVar(0, len(days) * len(shifts), f'total_{emp_id}')
            self.model.Add(sum(emp_total) == total_var)
            total_shifts_vars.append(total_var)

        # Установить цель
        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        # Решение с увеличенным временем
        self.solver.parameters.max_time_in_seconds = 60.0  # Увеличили до 60 секунд
        print(f"[CP-SAT Python] Starting solver...")
        status = self.solver.Solve(self.model)

        print(f"[CP-SAT Python] Solver finished with status: {status}")

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Извлечение результатов
            schedule = []
            total_assignments = 0

            for emp in employees:
                emp_id = emp['emp_id']
                for day_idx, day in enumerate(days):
                    for shift in shifts:
                        for position in positions:
                            key = (emp_id, day_idx, shift['shift_id'], position['pos_id'])
                            if key in assignments and self.solver.Value(assignments[key]):
                                schedule.append({
                                    'emp_id': emp_id,
                                    'date': day['date'],
                                    'shift_id': shift['shift_id'],
                                    'position_id': position['pos_id']
                                })
                                total_assignments += 1

            print(f"[CP-SAT Python] Generated {total_assignments} assignments")

            return {
                'success': True,
                'schedule': schedule,
                'status': 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE',
                'solve_time': self.solver.WallTime(),
                'assignments_count': total_assignments
            }
        else:
            return {
                'success': False,
                'error': f'Solver failed with status: {status} (INFEASIBLE - constraints too strict)',
                'status': status,
                'debug_info': {
                    'employees': len(employees),
                    'shifts': len(shifts),
                    'positions': len(positions),
                    'cannot_work_constraints': len(constraints.get('cannot_work', [])),
                    'prefer_work_constraints': len(constraints.get('prefer_work', []))
                }
            }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Input JSON file')
    parser.add_argument('--output', required=True, help='Output JSON file')
    args = parser.parse_args()

    try:
        # Читаем входные данные
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Создаем оптимизатор и запускаем
        optimizer = ShiftSchedulerCP()
        result = optimizer.optimize_schedule(data)

        # Записываем результат
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"[CP-SAT Python] Optimization completed. Success: {result['success']}")
        if not result['success']:
            print(f"[CP-SAT Python] Error details: {result.get('error', 'Unknown error')}")

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(error_result, f, ensure_ascii=False, indent=2)
        print(f"[CP-SAT Python] Error: {str(e)}")

if __name__ == "__main__":
    main()