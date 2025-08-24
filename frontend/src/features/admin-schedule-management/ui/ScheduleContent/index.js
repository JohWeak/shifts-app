// frontend/src/features/admin-schedule-management/ui/ScheduleContent/index.js

import React from 'react';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import ScheduleList from '../ScheduleList';
import ScheduleView from '../ScheduleView';
import { motion, AnimatePresence } from 'motion/react';

const ScheduleContent = ({ onScheduleDeleted, handleViewDetails, ...viewProps }) => {
    const { schedules, selectedScheduleId, loading } = useSelector((state) => state.schedule);

    if (loading === 'pending' && !schedules.length) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" />
            </div>
        );
    }

    // if schedule is selected, show details, otherwise show list
    return (
        <AnimatePresence mode="wait">
            {selectedScheduleId ? (
                <motion.div
                    key={selectedScheduleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <ScheduleView {...viewProps} />
                </motion.div>
            ) : (

                <motion.div
                    key="schedule-list"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <ScheduleList
                        schedules={schedules}
                        onViewDetails={handleViewDetails}
                        onScheduleDeleted={onScheduleDeleted}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScheduleContent;