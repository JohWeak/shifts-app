// frontend/src/features/admin-schedule-management/ui/ScheduleContent/index.js

import React from 'react';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import ScheduleList from '../ScheduleList';
import ScheduleView from '../ScheduleView';

// Принимаем все UI-пропсы через ...rest
const ScheduleContent = ({ onScheduleDeleted, handleViewDetails, ...viewProps }) => {
    const { schedules, activeTab, selectedScheduleId, loading } = useSelector((state) => state.schedule);

    if (loading === 'pending' && !schedules.length) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" />
            </div>
        );
    }

    if (activeTab === 'view' && selectedScheduleId) {
        return <ScheduleView {...viewProps} />;
    }

    return (
        <ScheduleList
            schedules={schedules}
            onViewDetails={handleViewDetails}
            onScheduleDeleted={onScheduleDeleted}
        />
    );
};
export default ScheduleContent;