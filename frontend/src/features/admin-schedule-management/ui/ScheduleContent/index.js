// frontend/src/features/admin-schedule-management/ui/ScheduleContent/index.js

import React from 'react';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import ScheduleList from '../ScheduleList';
import ScheduleView from '../ScheduleView';

const ScheduleContent = ({ onScheduleDeleted, handleViewDetails, ...viewProps }) => {
    const { schedules, selectedScheduleId, loading } = useSelector((state) => state.schedule);

    if (loading === 'pending' && !schedules.length) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" />
            </div>
        );
    }

    // Simple condition: if schedule is selected, show details, otherwise show list
    if (selectedScheduleId) {
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