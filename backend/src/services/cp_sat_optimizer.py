# backend/src/services/cp_sat_optimizer.py
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

        # Ограничения покрытия позиций
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        assignment_vars.append(
                            assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                        )
                    # Точно нужное количество сотрудников
                    self.model.Add(sum(assignment_vars) == position['num_of_emp'])

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
            day_idx = constraint['day_index']
            shift_id = constraint['shift_id']

            for position in positions:
                if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                    self.model.Add(assignments[(emp_id, day_idx, shift_id, position['pos_id'])] == 0)

        # Ограничения по часам (максимум 42 часа в неделю)
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
            self.model.Add(sum(weekly_hours) <= 42)

        # Цель: максимизировать удовлетворение предпочтений "prefer_work"
        objective_terms = []
        for constraint in constraints.get('prefer_work', []):
            emp_id = constraint['emp_id']
            day_idx = constraint['day_index']
            shift_id = constraint['shift_id']

            for position in positions:
                if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                    objective_terms.append(
                        assignments[(emp_id, day_idx, shift_id, position['pos_id'])] * 10
                    )

        # Справедливость: минимизировать разброс в количестве смен
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

        # Минимизировать максимальное отклонение
        if len(total_shifts_vars) > 1:
            max_diff = self.model.NewIntVar(0, len(days) * len(shifts), 'max_diff')
            for i in range(len(total_shifts_vars)):
                for j in range(i + 1, len(total_shifts_vars)):
                    diff = self.model.NewIntVar(-len(days) * len(shifts), len(days) * len(shifts), f'diff_{i}_{j}')
                    self.model.Add(diff == total_shifts_vars[i] - total_shifts_vars[j])
                    self.model.AddAbsEquality(max_diff, diff)

            objective_terms.append(max_diff * -5)  # Штраф за неравенство

        # Установить цель
        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        # Решение
        self.solver.parameters.max_time_in_seconds = 30.0
        status = self.solver.Solve(self.model)

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Извлечение результатов
            schedule = []
            for emp in employees:
                emp_id = emp['emp_id']
                for day_idx, day in enumerate(days):
                    for shift in shifts:
                        for position in positions:
                            if self.solver.Value(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]):
                                schedule.append({
                                    'emp_id': emp_id,
                                    'date': day['date'],
                                    'shift_id': shift['shift_id'],
                                    'position_id': position['pos_id']
                                })

            return {
                'success': True,
                'schedule': schedule,
                'status': 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE',
                'solve_time': self.solver.WallTime()
            }
        else:
            return {
                'success': False,
                'error': f'Solver failed with status: {status}',
                'status': status
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