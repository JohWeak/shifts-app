// frontend/src/features/employee-archive/index.js
import React, {useState, useEffect, useRef} from 'react';
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import CalendarView from './ui/CalendarView/CalendarView';
import MonthlyStats from './ui/MonthlyStats/MonthlyStats';
import ShiftDetailsPanel from './ui/ShiftDetailsPanel/ShiftDetailsPanel';
import { scheduleAPI } from 'shared/api/apiService';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import './index.css';

const EmployeeArchive = () => {
    const { t } = useI18n();
    const { user } = useSelector(state => state.auth);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [monthData, setMonthData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableMonths, setAvailableMonths] = useState([]);

    const { getShiftColor } = useShiftColor();
    const monthDataCache = useRef({});

    useEffect(() => {
        fetchEmployeeArchiveSummary();
    }, []);

    useEffect(() => {
        if (selectedMonth) {
            fetchMonthData(selectedMonth);
        }
    }, [selectedMonth]);

    const fetchEmployeeArchiveSummary = async () => {
        try {
            const response = await scheduleAPI.fetchEmployeeArchiveSummary();
            if (response.data) {
                setAvailableMonths(response.data.availableMonths);
                if (!selectedMonth && response.data.availableMonths.length > 0) {
                    // Set current month as default
                    const currentMonth = new Date();
                    setSelectedMonth(currentMonth);
                }
            }
        } catch (err) {
            console.error('Error fetching archive summary:', err);
            setError(err.message);
        }
    };

    const fetchMonthData = async (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const cacheKey = `${year}-${month}`;

        // Check cache first
        if (monthDataCache.current[cacheKey]) {
            setMonthData(monthDataCache.current[cacheKey]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await scheduleAPI.fetchEmployeeArchiveMonth(year, month);
            if (response.data) {
                monthDataCache.current[cacheKey] = response.data;
                setMonthData(response.data);
            }
        } catch (err) {
            console.error('Error fetching month data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (newMonth) => {
        setSelectedMonth(newMonth);
        setSelectedDate(null);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const getSelectedDayShift = () => {
        if (!selectedDate || !monthData?.shifts) return null;
        const dateStr = selectedDate.toISOString().split('T')[0];
        return monthData.shifts.find(shift => shift.work_date === dateStr);
    };

    return (
        <Container fluid className="employee-archive-container">
            <PageHeader
                icon="archive"
                title={t('employee.archive.title')}
                subtitle={t('employee.archiveSubtitle')}
            />

            {error && <ErrorMessage message={error} />}

            {loading ? (
                <LoadingState />
            ) : (
                <div className="archive-content">
                    <CalendarView
                        selectedMonth={selectedMonth}
                        onMonthChange={handleMonthChange}
                        monthData={monthData}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        availableMonths={availableMonths}
                        getShiftColor={getShiftColor}
                    />

                    <MonthlyStats monthData={monthData} />

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