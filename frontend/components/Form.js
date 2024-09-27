import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';

// Validation errors for Yup
const validationErrors = {
  fullNameTooShort: 'full name must be at least 3 characters',
  fullNameTooLong: 'full name must be at most 20 characters',
  sizeIncorrect: 'size must be S or M or L'
}

// Schema for form validation
const orderSchema = yup.object().shape({
  fullName: yup
    .string()
    .trim()
    .min(3, validationErrors.fullNameTooShort)
    .max(20, validationErrors.fullNameTooLong),
  size: yup
    .string()
    .oneOf(['S', 'M', 'L'], validationErrors.sizeIncorrect),
});

// Toppings array for checkboxes
const toppings = [
  { topping_id: '1', text: 'Pepperoni' },
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' },
];

export default function Form() {
  const baseForm = {
    fullName: '',
    size: '',
    toppings: [],
  };

  const [formData, setFormData] = useState(baseForm);
  const [errors, setErrors] = useState({ fullName: '', size: '' });
  const [serverSuccess, setServerSuccess] = useState('');
  const [serverFailure, setServerFailure] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    orderSchema.isValid(formData).then((isValid) => setEnabled(isValid));
    validate(formData.fullName, formData.size, setErrors);
  }, [formData.fullName, formData.size]);

  const validate = async (fullName, size, setErrors) => {
    try {
      setErrors({ fullName: '', size: '' });
      await orderSchema.validate({ fullName, size }, { abortEarly: false });
      return { isValid: true };
    } catch (error) {
      const newErrors = { fullName: '', size: '' };
      error.inner.forEach(err => {
        if (err.path === 'fullName') {
          newErrors.fullName = err.message;
        } else if (err.path === 'size') {
          newErrors.size = err.message;
        }
      });
      setErrors(newErrors);
      return { isValid: false, message: error.message };
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prevState) => ({
        ...prevState,
        toppings: checked
          ? [...prevState.toppings, value]
          : prevState.toppings.filter((topping) => topping !== value),
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('http://localhost:9009/api/order', formData)
      .then((res) => {
        setFormData(baseForm);
        setServerSuccess(res.data.message);
        setServerFailure('');
      })
      .catch((err) => {
        setServerFailure(err.response.data.message);
        setServerSuccess('');
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Order Your Pizza</h2>
      {serverSuccess && <div className="success">{serverSuccess}</div>}
      {serverFailure && <div className="failure">{serverFailure}</div>}

      <div className="input-group">
        <div>
          <label htmlFor="fullName">Full Name</label>
          <br />
          <input
            placeholder="Type full name"
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        {errors.fullName && <div className="error">{errors.fullName}</div>}
      </div>

      <div className="input-group">
        <div>
          <label htmlFor="size">Size</label>
          <br />
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
          >
            <option value="">----Choose Size----</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
        {errors.size && <div className="error">{errors.size}</div>}
      </div>

      <div className="input-group">
        {toppings.map((topping) => (
          <label key={topping.topping_id}>
            <input
              name={topping.text}
              type="checkbox"
              value={topping.topping_id}
              checked={formData.toppings.includes(topping.topping_id)}
              onChange={handleChange}
            />
            {topping.text}
            <br />
          </label>
        ))}
      </div>
      <input type="submit" disabled={!enabled} />
    </form>
  );
}
