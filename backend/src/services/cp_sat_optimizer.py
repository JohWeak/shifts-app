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
        """Преобразует время формата HH:MM:SS в часы"""
        parts = time_str.split(':')
        return int(parts[0]) + int(parts[1]) / 60

    def _calculate_rest_hours(self, shift1, shift2, is_next_day=False):
        """Вычисляет часы отдыха между двумя сменами"""
        shift1_end = self._parse_time(shift1['start_time']) + shift1['duration']
        shift2_start = self._parse_time(shift2['start_time'])

        if is_next_day:
            # Если смены в разные дни
            if shift1_end > 24:  # Ночная смена переходит на следующий день
                shift1_end -= 24
                rest_hours = shift2_start - shift1_end
            else:
                rest_hours = (24 - shift1_end) + shift2_start
        else:
            # Смены в один день
            rest_hours = shift2_start - shift1_end

        return rest_hours

    def optimize_schedule(self, data):
        """Универсальная оптимизация расписания с настраиваемыми ограничениями"""
        print(f"[Universal CP-SAT] Starting optimization...")

        # Извлечение данных
        employees = data['employees']
        shifts = data['shifts']
        positions = data['positions']
        days = data['days']
        constraints = data['constraints']
        settings = data.get('settings', {})

        # Получение ограничений из конфигурации
        hard_constraints = settings.get('hard_constraints', {})
        soft_constraints = settings.get('soft_constraints', {})
        optimization_weights = settings.get('optimization_weights', {})

        # Жесткие ограничения (закон)
        max_hours_per_day = hard_constraints.get('max_hours_per_day', 12)
        min_rest_between_shifts = hard_constraints.get('min_rest_between_shifts', 11)
        max_night_shifts_per_week = hard_constraints.get('max_night_shifts_per_week', 3)

        # Мягкие ограничения (настройки админа)
        max_shifts_per_day = soft_constraints.get('max_shifts_per_day', 1)
        max_consecutive_work_days = soft_constraints.get('max_consecutive_work_days', 6)
        max_hours_per_week = soft_constraints.get('max_hours_per_week', 48)

        # Ограничения на количество дней "не работать" и "предпочитаю работать"
        max_cannot_work_days = settings.get('max_cannot_work_days_per_week', 2)
        max_prefer_work_days = settings.get('max_prefer_work_days_per_week', 3)

        print(f"[Universal CP-SAT] Configuration:")
        print(f"  - Max {max_hours_per_day}h/day, min {min_rest_between_shifts}h rest")
        print(f"  - Max {max_shifts_per_day} shifts/day, {max_consecutive_work_days} consecutive days")
        print(f"  - Max cannot-work days: {max_cannot_work_days}, prefer-work days: {max_prefer_work_days}")

        # Создание переменных решения
        assignments = {}
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx, day in enumerate(days):
                for shift in shifts:
                    for position in positions:
                        var_name = f"assign_{emp_id}_{day_idx}_{shift['shift_id']}_{position['pos_id']}"
                        assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] = \
                            self.model.NewBoolVar(var_name)

        # 1. ОГРАНИЧЕНИЯ ПОКРЫТИЯ ПОЗИЦИЙ (с учетом настроек админа)
        shortage_vars = []
        for day_idx in range(len(days)):
            for shift in shifts:
                for position in positions:
                    assignment_vars = []
                    for emp in employees:
                        # Только сотрудники с соответствующей позицией
                        if emp.get('default_position_id') == position['pos_id']:
                            assignment_vars.append(
                                assignments[(emp['emp_id'], day_idx, shift['shift_id'], position['pos_id'])]
                            )

                    # Админ может настроить количество сотрудников на смену
                    required_employees = position.get('num_of_emp', 1)

                    # Переменная недохвата
                    shortage_var = self.model.NewIntVar(0, required_employees,
                                                        f"shortage_{day_idx}_{shift['shift_id']}_{position['pos_id']}")
                    shortage_vars.append(shortage_var)

                    # Гибкое ограничение
                    self.model.Add(sum(assignment_vars) + shortage_var == required_employees)

        # 2. ЖЕСТКИЕ ОГРАНИЧЕНИЯ (ЗАКОН)

        # 2.1 Максимум часов в день
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
                            # Учитываем реальную длительность смены
                            day_hours.append(assignment_var * shift['duration'])

                # Жесткое ограничение на часы
                self.model.Add(sum(day_hours) <= max_hours_per_day)

                # Мягкое ограничение на количество смен
                self.model.Add(sum(day_assignments) <= max_shifts_per_day)

        # 2.2 Минимальный отдых между сменами в один день
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days)):
                for i, shift1 in enumerate(shifts):
                    for j, shift2 in enumerate(shifts):
                        if i < j:  # Только для разных смен
                            rest_hours = self._calculate_rest_hours(shift1, shift2, False)

                            if rest_hours < min_rest_between_shifts:
                                # Запрещаем работать обе смены
                                for position in positions:
                                    if ((emp_id, day_idx, shift1['shift_id'], position['pos_id']) in assignments and
                                            (emp_id, day_idx, shift2['shift_id'], position['pos_id']) in assignments):
                                        self.model.Add(
                                            assignments[(emp_id, day_idx, shift1['shift_id'], position['pos_id'])] +
                                            assignments[(emp_id, day_idx, shift2['shift_id'], position['pos_id'])] <= 1
                                        )

        # 2.3 Минимальный отдых между сменами в разные дни
        for emp in employees:
            emp_id = emp['emp_id']
            for day_idx in range(len(days) - 1):
                # Проверяем все комбинации смен между днями
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

        # 2.4 Максимум ночных смен в неделю
        for emp in employees:
            emp_id = emp['emp_id']
            night_shifts_count = []

            for day_idx in range(len(days)):
                for shift in shifts:
                    if shift.get('shift_type') == 'night' or shift.get('is_night_shift'):
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                night_shifts_count.append(
                                    assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                                )

            if night_shifts_count:
                self.model.Add(sum(night_shifts_count) <= max_night_shifts_per_week)

        # 3. МЯГКИЕ ОГРАНИЧЕНИЯ (НАСТРОЙКИ АДМИНА)

        # 3.1 Максимум последовательных рабочих дней
        for emp in employees:
            emp_id = emp['emp_id']
            for start_day in range(len(days) - max_consecutive_work_days):
                consecutive_days = []

                for day_offset in range(max_consecutive_work_days + 1):
                    day_idx = start_day + day_offset
                    day_worked = []

                    for shift in shifts:
                        for position in positions:
                            if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                day_worked.append(
                                    assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])]
                                )

                    # Переменная "работал ли в этот день"
                    worked_var = self.model.NewBoolVar(f'worked_{emp_id}_{day_idx}')
                    self.model.AddMaxEquality(worked_var, day_worked)
                    consecutive_days.append(worked_var)

                # Ограничение на последовательные дни
                self.model.Add(sum(consecutive_days) <= max_consecutive_work_days)

        # 3.2 Максимум часов в неделю
        for emp in employees:
            emp_id = emp['emp_id']
            week_hours = []

            for day_idx in range(len(days)):
                for shift in shifts:
                    for position in positions:
                        if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                            week_hours.append(
                                assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] * shift['duration']
                            )

            self.model.Add(sum(week_hours) <= max_hours_per_week)

        # 4. ОБРАБОТКА ОГРАНИЧЕНИЙ СОТРУДНИКОВ

        # 4.1 Ограничения "не могу работать" с лимитом
        cannot_work = constraints.get('cannot_work', [])

        # Группируем по сотрудникам
        employee_cannot_work = {}
        for constraint in cannot_work:
            emp_id = constraint['emp_id']
            if emp_id not in employee_cannot_work:
                employee_cannot_work[emp_id] = []
            employee_cannot_work[emp_id].append(constraint)

        # Применяем ограничения с учетом лимита
        for emp_id, emp_constraints in employee_cannot_work.items():
            # Сортируем по приоритету если есть
            emp_constraints.sort(key=lambda x: x.get('priority', 0), reverse=True)

            # Применяем только разрешенное количество
            for i, constraint in enumerate(emp_constraints[:max_cannot_work_days]):
                day_idx = constraint.get('day_index')
                shift_id = constraint.get('shift_id')

                if day_idx is not None:
                    if shift_id:
                        # Конкретная смена
                        for position in positions:
                            if (emp_id, day_idx, shift_id, position['pos_id']) in assignments:
                                self.model.Add(assignments[(emp_id, day_idx, shift_id, position['pos_id'])] == 0)
                    else:
                        # Весь день
                        for shift in shifts:
                            for position in positions:
                                if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                    self.model.Add(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0)

        # 4.2 Привязка к позициям (только к своей позиции)
        for emp in employees:
            emp_id = emp['emp_id']
            default_position_id = emp.get('default_position_id')

            if default_position_id:
                for day_idx in range(len(days)):
                    for shift in shifts:
                        for position in positions:
                            if position['pos_id'] != default_position_id:
                                if (emp_id, day_idx, shift['shift_id'], position['pos_id']) in assignments:
                                    self.model.Add(assignments[(emp_id, day_idx, shift['shift_id'], position['pos_id'])] == 0)

        # 5. ЦЕЛЕВАЯ ФУНКЦИЯ
        objective_terms = []

        # 5.1 Минимизировать недохват (высший приоритет)
        coverage_weight = optimization_weights.get('coverage_weight', 100)
        for shortage_var in shortage_vars:
            objective_terms.append(shortage_var * -coverage_weight)

        # 5.2 Учет предпочтений сотрудников
        prefer_work = constraints.get('prefer_work', [])
        preference_weight = optimization_weights.get('employee_preference_weight', 10)

        # Группируем и применяем с лимитом
        employee_prefer_work = {}
        for constraint in prefer_work:
            emp_id = constraint['emp_id']
            if emp_id not in employee_prefer_work:
                employee_prefer_work[emp_id] = []
            employee_prefer_work[emp_id].append(constraint)

        for emp_id, emp_preferences in employee_prefer_work.items():
            # Применяем только разрешенное количество
            for constraint in emp_preferences[:max_prefer_work_days]:
                day_idx = constraint.get('day_index')
                shift_id = constraint.get('shift_id')

                if day_idx is not None:
                    # Находим позицию сотрудника
                    emp_data = next((e for e in employees if e['emp_id'] == emp_id), None)
                    if emp_data and emp_data.get('default_position_id'):
                        position_id = emp_data['default_position_id']

                        if shift_id:
                            # Конкретная смена
                            if (emp_id, day_idx, shift_id, position_id) in assignments:
                                objective_terms.append(
                                    assignments[(emp_id, day_idx, shift_id, position_id)] * preference_weight
                                )
                        else:
                            # Любая смена в этот день
                            for shift in shifts:
                                if (emp_id, day_idx, shift['shift_id'], position_id) in assignments:
                                    objective_terms.append(
                                        assignments[(emp_id, day_idx, shift['shift_id'], position_id)] * preference_weight
                                    )

        # 5.3 Балансировка нагрузки
        workload_balance_weight = optimization_weights.get('workload_balance_weight', 5)
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

        # Минимизировать разницу между максимальной и минимальной нагрузкой
        if len(total_shifts_vars) > 1:
            max_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'max_shifts')
            min_shifts = self.model.NewIntVar(0, len(days) * len(shifts), 'min_shifts')

            self.model.AddMaxEquality(max_shifts, total_shifts_vars)
            self.model.AddMinEquality(min_shifts, total_shifts_vars)

            balance_var = self.model.NewIntVar(0, len(days) * len(shifts), 'balance')
            self.model.Add(balance_var == max_shifts - min_shifts)
            objective_terms.append(balance_var * -workload_balance_weight)

        # Установить целевую функцию
        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        # 6. РЕШЕНИЕ
        self.solver.parameters.max_time_in_seconds = settings.get('max_solve_time', 120.0)
        print(f"[Universal CP-SAT] Starting solver with {len(objective_terms)} objective terms...")
        status = self.solver.Solve(self.model)

        print(f"[Universal CP-SAT] Solver finished with status: {status}")

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Извлечение результатов
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

            for emp in employees:
                emp_id = emp['emp_id']
                emp_hours = 0
                emp_shifts = 0

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
                                stats['total_assignments'] += 1
                                emp_hours += shift['duration']
                                emp_shifts += 1

                                if emp.get('default_position_id') == position['pos_id']:
                                    stats['position_matches'] += 1

                stats['hours_per_employee'][emp_id] = emp_hours
                stats['shifts_per_employee'][emp_id] = emp_shifts

            # Подсчет недохвата
            for shortage_var in shortage_vars:
                stats['total_shortage'] += self.solver.Value(shortage_var)

            coverage_rate = (stats['total_assignments'] /
                             (stats['total_assignments'] + stats['total_shortage']) * 100
                             if (stats['total_assignments'] + stats['total_shortage']) > 0 else 100)

            return {
                'success': True,
                'schedule': schedule,
                'status': 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE',
                'solve_time': self.solver.WallTime(),
                'stats': stats,
                'coverage_rate': coverage_rate
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
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)

        optimizer = UniversalShiftSchedulerCP()
        result = optimizer.optimize_schedule(data)

        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"[Universal CP-SAT] Optimization completed. Success: {result['success']}")
        if result['success']:
            print(f"Coverage rate: {result.get('coverage_rate', 0):.1f}%")

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(error_result, f, ensure_ascii=False, indent=2)
        print(f"[Universal CP-SAT] Error: {str(e)}")

if __name__ == "__main__":
    main()