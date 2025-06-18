import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Form, Modal, Badge } from 'react-bootstrap';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';
import { fetchPositions, updatePosition } from '../../app/store/slices/positionSlice';

const Index = ({ siteId }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { positions, loading } = useSelector(state => state.positions);
    const [editingPosition, setEditingPosition] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (siteId) {
            dispatch(fetchPositions(siteId));
        }
    }, [dispatch, siteId]);

    const handleEdit = (position) => {
        setEditingPosition({
            ...position,
            num_of_emp: position.num_of_emp || 1,
            min_experience_months: position.min_experience_months || 0,
            requires_certification: position.requires_certification || false
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        await dispatch(updatePosition(editingPosition));
        setShowModal(false);
        setEditingPosition(null);
    };

    return (
        <>
            <Table responsive striped hover>
                <thead>
                <tr>
                    <th>{t('position.positionName')}</th>
                    <th>{t('position.profession')}</th>
                    <th>{t('position.employeesPerShift')}</th>
                    <th>{t('position.requirements')}</th>
                    <th>{t('common.actions')}</th>
                </tr>
                </thead>
                <tbody>
                {positions.map(position => (
                    <tr key={position.pos_id}>
                        <td>{position.pos_name}</td>
                        <td>{position.profession}</td>
                        <td>
                            <Badge bg="primary">{position.num_of_emp || 1}</Badge>
                        </td>
                        <td>
                            {position.requires_certification && (
                                <Badge bg="warning" className="me-1">
                                    {t('position.certificationRequired')}
                                </Badge>
                            )}
                            {position.min_experience_months > 0 && (
                                <Badge bg="info">
                                    {t('position.minExperience', { months: position.min_experience_months })}
                                </Badge>
                            )}
                        </td>
                        <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEdit(position)}
                            >
                                <i className="bi bi-pencil me-1"></i>
                                {t('common.edit')}
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('position.editPosition')}: {editingPosition?.pos_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingPosition && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('position.employeesPerShift')}</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={editingPosition.num_of_emp}
                                    onChange={(e) => setEditingPosition({
                                        ...editingPosition,
                                        num_of_emp: parseInt(e.target.value)
                                    })}
                                />
                                <Form.Text className="text-muted">
                                    {t('position.employeesPerShiftHint')}
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{t('position.minExperienceMonths')}</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={editingPosition.min_experience_months}
                                    onChange={(e) => setEditingPosition({
                                        ...editingPosition,
                                        min_experience_months: parseInt(e.target.value)
                                    })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="requires-certification"
                                    label={t('position.requiresCertification')}
                                    checked={editingPosition.requires_certification}
                                    onChange={(e) => setEditingPosition({
                                        ...editingPosition,
                                        requires_certification: e.target.checked
                                    })}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Index;