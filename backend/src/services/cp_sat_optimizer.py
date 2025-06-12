# backend/src/services/cp_sat_optimizer.py
from ortools.sat.python import cp_model
import json
import sys
import argparse
from datetime import datetime, timedelta

class ImprovedShiftSchedulerCP:
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def optimize_schedule(self, data):
        """Оптимизация расписания с гибкими ограничениями"""
        print(f"[CP-SAT Improved] Starting optimization...")

        employees = data['employees']
        shifts = data['shifts']
        positions = data['positions']
        days = data['days']
        constraints = data['constraints']
        settings = data['settings']

        print(f"[CP-SAT Improved] Data: {len(employees)} employees, {len(shifts)} shifts, {len(positions)} positions")

        # Дебаг: показать сотрудников с дефолтными позициями
        employees_with_default = [emp for emp in employees if emp.get('default_position_id')]
        print(f"[CP-SAT Improved] Employees with default positions: {len(employees_with_default)}")
        for emp in employees_with_default:
            print(f"  - {emp['name']} -> position {emp['default_position_id']}")

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

        # ГИБКИЕ ограничения покрытия позиций
        shortage_vars = []
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        assignment_vars.append(
                            assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                        )

                    # Переменная для недохвата
                    shortage_var = self.model.NewIntVar(0, position['num_of_emp'],
                                                        f"shortage_{day_idx}_{shift['shift_id']}_{position['pos_id']}")
                    shortage_vars.append(shortage_var)

                    # Гибкое ограничение: назначенные + недохват = требуемое количество
                    self.model.Add(sum(assignment_vars) + shortage_var == position['num_of_emp'])

        # Ограничения сотрудников (максимум 1 смена в день)
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                day_assignments = []
                for shift in shifts:
                    for position in positions:
                        day_assignments.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])])
                self.model.Add(sum(day_assignments) <= 1)

        # ЖЕСТКИЕ ограничения cannot_work
        cannot_work = constraints.get('cannot_work', [])
        print(f"[CP-SAT Improved] Processing {len(cannot_work)} cannot_work constraints")

        for constraint in cannot_work:
            emp_id = constraint['emp_id']
            day_idx = constraint.get('day_index')
            shift_id = constraint.get('shift_id')

            if day_idx is not None:
                if shift_id:
                    # Конкретная смена в конкретный день
                    for position in positions:
                        if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                            self.model.Add(assignments[(emp_id, day_idx, shift_id, position['pos_id'])] == 0)
                else:
                    # Весь день
                    for shift in shifts:
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                self.model.Add(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0)

        # Установка цели: приоритизировать дефолтные позиции
        objective_terms = []

        # 1. ВЫСОКИЙ ПРИОРИТЕТ: назначение на дефолтную позицию
        position_preference_score = 0
        cross_position_penalty = 0

        print(f"[CP-SAT Improved] Applying STRICT position constraints...")

        for emp in employees:
            emp_id = emp['emp_id']
            default_position_id = emp.get('default_position_id')

            if default_position_id:
                # БЛОКИРУЕМ все позиции кроме дефолтной
                for day_idx in range(len(days)):
                    for shift in shifts:
                        for position in positions:
                            if position['pos_id'] != default_position_id:
                                # ЖЕСТКОЕ ограничение: не может работать на других позициях
                                if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                    self.model.Add(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0)

                print(f"  - {emp['name']} restricted to position {default_position_id} only")

        # 2. Минимизировать недохват (очень высокий приоритет)
        for shortage_var in shortage_vars:
            objective_terms.append(shortage_var * -200)  # Очень высокий штраф за недохват

        # 3. МЯГКИЕ ограничения prefer_work
        prefer_work = constraints.get('prefer_work', [])
        print(f"[CP-SAT Improved] Processing {len(prefer_work)} prefer_work constraints")

        for constraint in prefer_work:
            emp_id = constraint['emp_id']
            day_idx = constraint.get('day_index')
            shift_id = constraint.get('shift_id')

            if day_idx is not None:
                if shift_id:
                    # Конкретная смена
                    for position in positions:
                        if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                            objective_terms.append(assignments[(emp_id, day_idx, shift_id, position['pos_id'])] * 30)
                else:
                    # Любая смена в этот день
                    for shift in shifts:
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                objective_terms.append(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] * 30)

        # 4. Балансировка нагрузки между сотрудниками
        total_shifts_vars = []
        for emp in employees:
            emp_id = emp['emp_id']
            default_position_id = emp.get('default_position_id')

            if default_position_id:
                emp_assignments = []
                for day_idx in range(len(days)):
                    for shift in shifts:
                        # Только назначения на дефолтную позицию
                        emp_assignments.append(assignments[(emp_id, day_idx, shift['shift_id'], default_position_id)])

                total_var = self.model.NewIntVar(0, len(days) * len(shifts), f'total_shifts_{emp_id}')
                self.model.Add(sum(emp_assignments) == total_var)
                total_shifts_vars.append(total_var)

        # Минимизировать разброс в нагрузке
        if len(total_shifts_vars) > 1:
            max_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'max_shifts')
            min_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'min_shifts')

            self.model.AddMaxEquality(max_shifts, total_shifts_vars)
            self.model.AddMinEquality(min_shifts, total_shifts_vars)

            balance_var = self.model.NewIntVar(0, len(days) * len(shifts), 'balance')
            self.model.Add(balance_var == max_shifts - min_shifts)
            objective_terms.append(balance_var * -10)  # Штраф за дисбаланс

        # Установить цель
        if objective_terms:
            self.model.Maximize(sum(objective_terms))
            print(f"[CP-SAT Improved] Objective has {len(objective_terms)} terms")

        # Решение с увеличенным временем
        self.solver.parameters.max_time_in_seconds = 120.0  # 2 минуты
        print(f"[CP-SAT Improved] Starting solver...")
        status = self.solver.Solve(self.model)

        print(f"[CP-SAT Improved] Solver finished with status: {status}")

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Извлечение результатов
            schedule = []
            total_assignments = 0
            total_shortage = 0
            position_matches = 0
            cross_position_assignments = 0

            for emp in employees:
                emp_id = emp['emp_id']
                default_position_id = emp.get('default_position_id')

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

                                # Подсчет совпадений с дефолтной позицией
                                if default_position_id == position['pos_id']:
                                    position_matches += 1
                                elif default_position_id:
                                    cross_position_assignments += 1

            # Подсчет недохвата
            for shortage_var in shortage_vars:
                total_shortage += self.solver.Value(shortage_var)

            print(f"[CP-SAT Improved] Generated {total_assignments} assignments with {total_shortage} shortages")
            print(f"[CP-SAT Improved] Position matches: {position_matches}, Cross-position: {cross_position_assignments}")

            match_rate = (position_matches / total_assignments * 100) if total_assignments > 0 else 0
            print(f"[CP-SAT Improved] Default position match rate: {match_rate:.1f}%")

            return {
                'success': True,
                'schedule': schedule,
                'status': 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE',
                'solve_time': self.solver.WallTime(),
                'assignments_count': total_assignments,
                'shortage_count': total_shortage,
                'position_matches': position_matches,
                'cross_position_assignments': cross_position_assignments,
                'coverage_rate': (total_assignments / (total_assignments + total_shortage)) * 100 if (total_assignments + total_shortage) > 0 else 100
            }
        else:
            return {
                'success': False,
                'error': f'Solver failed with status: {status}',
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
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)

        optimizer = ImprovedShiftSchedulerCP()
        result = optimizer.optimize_schedule(data)

        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"[CP-SAT Improved] Optimization completed. Success: {result['success']}")
        if result['success']:
            print(f"Coverage rate: {result.get('coverage_rate', 0):.1f}%")

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(error_result, f, ensure_ascii=False, indent=2)
        print(f"[CP-SAT Improved] Error: {str(e)}")

if __name__ == "__main__":
    main()