// frontend/src/features/employee-archive/index.js
import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage';
import CalendarView from './ui/CalendarView';
import MonthlyStats from './ui/MonthlyStats';
import ShiftDetailsPanel from './ui/ShiftDetailsPanel';
import PageHeader from '../../shared/ui/components/PageHeader';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import {
    fetchEmployeeArchiveMonth,
    fetchEmployeeArchiveSummary,
} from 'features/employee-dashboard/model/employeeDataSlice';
import { useEmployeeDataAsAdmin } from 'features/admin-employee-management/model/hooks/useEmployeeDataAsAdmin';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import './index.css';


const EmployeeArchive = ({ employeeId, hidePageHeader = false }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    // Choose data source based on whether we're viewing as admin
    const isViewingAsAdmin = !!employeeId;

    // Use admin hook only when employeeId is provided
    const adminData = useEmployeeDataAsAdmin(isViewingAsAdmin ? employeeId : null);
    const regularEmployeeData = useSelector(state => state.employeeData);

    const employeeData = isViewingAsAdmin ? adminData : regularEmployeeData;

    const {
        archiveSummary,
        archiveSummaryLoading,
        archiveSummaryError,
        archiveCache,
        archiveLoading,
        archiveError,
    } = employeeData;

    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const { getShiftColor } = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        if (isViewingAsAdmin && adminData?.loadArchiveSummary) {
            adminData.loadArchiveSummary();
        } else if (!isViewingAsAdmin) {
            dispatch(fetchEmployeeArchiveSummary());
        }
    }, [dispatch, isViewingAsAdmin, employeeId]);

    // Загружаем данные для выбранного месяца
    useEffect(() => {
        if (selectedMonth) {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth() + 1;

            if (isViewingAsAdmin && adminData?.loadArchiveMonth) {
                adminData.loadArchiveMonth(year, month);
            } else if (!isViewingAsAdmin) {
                dispatch(fetchEmployeeArchiveMonth({ year, month }));
            }
        }
    }, [dispatch, selectedMonth, isViewingAsAdmin, employeeId]);

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
            {!isMobile && !hidePageHeader && (
                <PageHeader
                    icon="archive-fill"
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