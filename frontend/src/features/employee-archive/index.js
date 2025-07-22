// frontend/src/features/employee-archive/index.js
import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import CalendarView from './ui/CalendarView/CalendarView';
import MonthlyStats from './ui/MonthlyStats/MonthlyStats';
import ShiftDetailsPanel from './ui/ShiftDetailsPanel/ShiftDetailsPanel';
import PageHeader from "../../shared/ui/components/PageHeader/PageHeader";
import {useMediaQuery} from "../../shared/hooks/useMediaQuery";
import { fetchEmployeeArchiveSummary, fetchEmployeeArchiveMonth } from 'features/employee-dashboard/model/employeeDataSlice';
import { scheduleAPI } from 'shared/api/apiService';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import './index.css';


const EmployeeArchive = () => {
    const { t } = useI18n();
    const { user } = useSelector(state => state.auth);

    const dispatch = useDispatch();


    // --- Данные получаем из Redux ---
    const {
        archiveSummary,
        archiveSummaryLoading,
        archiveSummaryError,
        archiveCache,
        archiveLoading,
        archiveError
    } = useSelector(state => state.employeeData);

    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const { getShiftColor } = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        dispatch(fetchEmployeeArchiveSummary());
    }, [dispatch]);

    // Загружаем данные для выбранного месяца
    useEffect(() => {
        if (selectedMonth) {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth() + 1;
            dispatch(fetchEmployeeArchiveMonth({ year, month }));
        }
    }, [dispatch, selectedMonth]);

    const handleMonthChange = (newMonth) => {
        setSelectedMonth(newMonth);
        setSelectedDate(null);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };



    const availableMonths = archiveSummary?.availableMonths || [];
    const cacheKey = selectedMonth ? `${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}` : null;
    const monthData = cacheKey ? archiveCache[cacheKey]?.data : null;
    const error = archiveSummaryError || archiveError;
    const loading = (archiveSummaryLoading && !archiveSummary) || (archiveLoading && !monthData);

    const getSelectedDayShift = () => {
        if (!selectedDate || !monthData?.shifts) return null;
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        return monthData.shifts.find(shift => shift.work_date === dateStr);
    };



    return (
        <Container fluid className="employee-archive-container">
            {!isMobile && (
                <PageHeader
                    icon="shield-check"
                    title={t('employee.archive.title')}
                    subtitle={t('employee.archive.subtitle')}
                />
            )}
            {error && <ErrorMessage message={error} />}

            {loading ? (
                <LoadingState />
            ) : (
                <div className="archive-content">
                    <MonthlyStats monthData={monthData} />
                    <CalendarView
                        selectedMonth={selectedMonth}
                        onMonthChange={handleMonthChange}
                        monthData={monthData}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        availableMonths={availableMonths}
                        getShiftColor={getShiftColor}
                    />
                    {selectedDate && (
                        <ShiftDetailsPanel
                            shift={getSelectedDayShift()}
                            selectedDate={selectedDate}
                            getShiftColor={getShiftColor}
                        />
                    )}
                </div>
            )}
        </Container>
    );
};

export default EmployeeArchive;