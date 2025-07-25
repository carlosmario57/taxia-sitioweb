import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DriverForm = ({ onDriverCreated, editingDriver, onCancelEdit, message, error }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    licencia: '',
    telefono: '',
    estatus: 'Activo'
  });

  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (editingDriver) {
      setFormData({
        nombre: editingDriver.nombre || '',
        apellidos: editingDriver.apellidos || '',
        licencia: editingDriver.licencia || '',
        telefono: editingDriver.telefono || '',
        estatus: editingDriver.estatus || 'Activo'
      });
    }
  }, [editingDriver]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.apellidos || !formData.licencia || !formData.telefono) {
      setLocalError('Todos los campos son obligatorios');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingDriver) {
        await axios.put(`http://localhost:3001/api/conductores/${editingDriver.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/conductores', formData);
      }

      setFormData({
        nombre: '',
        apellidos: '',
        licencia: '',
        telefono: '',
        estatus: 'Activo'
      });

      onDriverCreated();
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <div className="driver-form">
      <h2>{editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Apellidos"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="licencia"
            value={formData.licencia}
            onChange={handleChange}
            placeholder="Número de Licencia"
          />
        </div>
        <div className="form-group">
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
          />
        </div>
        <div className="form-group">
          <select
            name="estatus"
            value={formData.estatus}
            onChange={handleChange}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        
        {(localError || error) && (
          <div className="error-message">
            {localError || error}
          </div>
        )}
        
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit">
            {editingDriver ? 'Actualizar' : 'Crear'}
          </button>
          {editingDriver && (
            <button type="button" onClick={onCancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DriverForm;