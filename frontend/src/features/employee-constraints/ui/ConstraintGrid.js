// frontend/src/features/employee-constraints/ui/ConstraintGrid.js
import React from 'react';
import {Button, Card, Table} from 'react-bootstrap';
import {Check, X} from 'react-bootstrap-icons';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {
    formatShiftTime,
    formatTableHeaderDate,
    getCanonicalShiftType,
    getDayName,
    getShiftIcon,
} from 'shared/lib/utils/scheduleUtils';

const GridCell = ({day, shift, onCellClick, getCellStyles, isJustChanged}) => {
    const {
        tdStyle,
        foregroundStyle,
        foregroundClasses,
        nextStatus
    } = getCellStyles(day.date, shift.shift_id);

    const dayShift = day.shifts.find(s => s.shift_id === shift.shift_id);
    const isNotClickable = !foregroundClasses.includes('clickable');
    const tdClassName = `constraint-td-wrapper ${isNotClickable ? 'not-allowed' : ''}`;
    const finalClasses = `${foregroundClasses} ${isJustChanged ? 'is-appearing' : ''}`;

    if (!dayShift) {
        return <td key={`${day.date}-${shift.shift_id}-empty`}
                   className={`${tdClassName} text-center text-muted align-middle`}>-</td>;
    }

    return (
        <td
            key={`${day.date}-${shift.shift_id}`}
            className={tdClassName}
            style={tdStyle}
        >
            <div
                className={finalClasses}
                style={foregroundStyle}
                onClick={() => onCellClick(day.date, shift.shift_id)}

                data-next-status={nextStatus}
            >
                <X className="cell-icon selected-icon icon-cannot-work"/>
                <Check className="cell-icon selected-icon icon-prefer-work"/>

                <X className="cell-icon hover-icon hover-icon-cannot-work"/>
                <Check className="cell-icon hover-icon hover-icon-prefer-work"/>
            </div>
        </td>
    );
};


const ShiftHeader = ({shift, getShiftHeaderStyle, getShiftHeaderCellStyle, as: Component = 'th'}) => {
    const canonicalType = getCanonicalShiftType(shift.shift_name);
    const icon = getShiftIcon(canonicalType);

    return (
        <Component
            className="shift-header-cell sticky-column"
            style={getShiftHeaderCellStyle(shift)}
        >
            <div
                className="shift-header-info"
                style={getShiftHeaderStyle(shift)}
            >
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.duration)}</span>
            </div>
        </Component>
    );
};

// <th>,  <td>)
const DayHeader = ({day, getDayHeaderClass, onCellClick, t, as: Component = 'th', isMobile = false}) => (
    <Component
        className={`${getDayHeaderClass(day.date)} day-header-cell`}
        onClick={() => onCellClick(day.date, null)}
    >
        <div className="day-name">{getDayName(new Date(day.date).getDay(), t, isMobile)}</div>
        <small className="day-date">
            {formatTableHeaderDate(new Date(day.date))}
        </small>
    </Component>
);


const ConstraintGrid = (props) => {
    const {
        template,
        uniqueShifts,
        onCellClick,
        getCellStyles,
        getDayHeaderClass,
        getShiftHeaderStyle,
        getShiftHeaderCellStyle,
        isMobile,
        justChangedCell,
        limitParams,
        usedCounts,
        onShowInstructions,
    } = props;

    const {t} = useI18n();
    const commonCellProps = {onCellClick, getCellStyles};

    const LimitsFooter = ({colSpan}) => (
        <tfoot className="info-footer">
        <tr>
            <td colSpan={colSpan} className="text-center p-2">
                <div className="d-flex justify-content-center align-items-center gap-2">
                    <Button
                        variant="outline-secondary"
                        className="rounded-circle help-button-inline"
                        onClick={onShowInstructions}
                        title={t('constraints.instructions.title')}
                    >
                        <i className="bi bi-question"></i>
                    </Button>
                    <p className="text-muted small mb-0">
                        {t('constraints.instructions.remaining', {
                            cannotWork: (limitParams.cannotWork - usedCounts.cannot_work),
                            preferWork: (limitParams.preferWork - usedCounts.prefer_work)
                        })}
                    </p>
                </div>
            </td>
        </tr>
        </tfoot>
    );

    const DesktopGrid = () => (
        <Card className="desktop-constraints d-none d-md-block">
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table bordered className=" full-schedule-table mb-0">
                        <thead>
                        <tr>
                            <th className="shift-header-cell sticky-column">{t('employee.schedule.shift')}</th>
                            {template.map(day => (
                                <DayHeader
                                    key={day.date}
                                    day={day}
                                    getDayHeaderClass={getDayHeaderClass}
                                    onCellClick={onCellClick}
                                    t={t}
                                />
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {uniqueShifts.map(shift => (
                            <tr key={shift.shift_id}>
                                <ShiftHeader
                                    shift={shift}
                                    getShiftHeaderStyle={getShiftHeaderStyle}
                                    getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                                    as="td"
                                />
                                {template.map(day => (
                                    <GridCell
                                        key={`${day.date}-${shift.shift_id}`}
                                        day={day}
                                        shift={shift}
                                        {...commonCellProps}
                                        isJustChanged={`${day.date}-${shift.shift_id}` === justChangedCell}
                                    />
                                ))}
                            </tr>
                        ))}
                        </tbody>
                        <LimitsFooter colSpan={template.length + 1}/>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );

    const MobileGrid = () => (
        <Card className=" mobile-constraints ">
            <Card.Body className="p-0">
                <Table bordered className="full-schedule-table mb-0">
                    <thead>
                    <tr>
                        <th className="shift-header-cell sticky-column">{t('common.day')}</th>
                        {uniqueShifts.map(shift => (
                            <ShiftHeader
                                key={shift.shift_id}
                                shift={shift}
                                getShiftHeaderStyle={getShiftHeaderStyle}
                                getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                                isMobile
                            />
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {template.map(day => (
                        <tr key={day.date}>
                            <DayHeader
                                day={day}
                                getDayHeaderClass={getDayHeaderClass}
                                onCellClick={onCellClick}
                                t={t}
                                as="td"
                                isMobile
                            />
                            {uniqueShifts.map(shift => (
                                <GridCell
                                    key={`${day.date}-${shift.shift_id}`}
                                    day={day}
                                    shift={shift}
                                    {...commonCellProps}
                                    isJustChanged={`${day.date}-${shift.shift_id}` === justChangedCell}
                                />
                            ))}
                        </tr>
                    ))}

                    </tbody>
                    <LimitsFooter colSpan={uniqueShifts.length + 1}/>
                </Table>
            </Card.Body>
        </Card>
    );

    return isMobile ? <MobileGrid/> : <DesktopGrid/>;
};

export default ConstraintGrid;