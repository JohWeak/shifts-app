// frontend/src/features/admin-schedule-management/ui/ScheduleList/components/index.js
import React from 'react';
import {Card, Table} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import ScheduleTableListRow from '../ScheduleTableListRow';
import {motion, AnimatePresence} from 'motion/react';
import './ScheduleTableList.css'

const ScheduleTableList = ({
                               schedules,
                               sortConfig,
                               requestSort,
                               title,
                               emptyMessage,
                               currentWeekScheduleIds,
                               onView,
                               onPublish,
                               onUnpublish,
                               onDelete,
                               className = '',
                               isCollapsible = false,
                               isOpen = true,
                               onToggle = () => {
                               }
                           }) => {
    const {t} = useI18n();

    return (
        <Card className="schedule-list-card mb-4">
            <Card.Header
                className={`schedule-list-header ${className} ${isCollapsible ? 'collapsible' : ''} ${!isOpen ? 'closed' : ''}`}
                onClick={onToggle}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{title}</h5>
                    {isCollapsible &&
                        <i className={`bi bi-chevron-down accordion-icon ${!isOpen ? 'closed' : ''}`}></i>}
                </div>
            </Card.Header>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.2, ease: 'easeInOut'}}
                        style={{overflow: 'hidden'}}
                    >
                        <Card.Body className="p-0">
                            {schedules.length === 0 ? (
                                <div className="text-center py-4 text-muted">{emptyMessage}</div>
                            ) : (
                                <div className="table-responsive">
                                    <Table className="schedule-overview-table mb-0">
                                        <thead>
                                        <tr>
                                            <SortableHeader sortKey="week" sortConfig={sortConfig}
                                                            onSort={requestSort}>{t('schedule.weekPeriod')}</SortableHeader>
                                            <SortableHeader sortKey="site" sortConfig={sortConfig}
                                                            onSort={requestSort}>{t('schedule.site')}</SortableHeader>
                                            <SortableHeader sortKey="updatedAt" sortConfig={sortConfig}
                                                            onSort={requestSort}>{t('common.lastUpdated')}</SortableHeader>
                                            <SortableHeader sortKey="status" sortConfig={sortConfig}
                                                            onSort={requestSort}>{t('schedule.status')}</SortableHeader>
                                            <th className="text-center actions-header">{t('common.actions')}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {schedules.map(schedule => (
                                            <ScheduleTableListRow
                                                key={schedule.id}
                                                schedule={schedule}
                                                isCurrent={currentWeekScheduleIds.has(schedule.id)}
                                                onView={onView}
                                                onPublish={onPublish}
                                                onUnpublish={onUnpublish}
                                                onDelete={onDelete}
                                            />
                                        ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default ScheduleTableList;