import React from 'react';
import './FormLabel.css';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ 
  children, 
  required = false, 
  className = '', 
  ...props 
}) => {
  const labelClasses = [
    className,
    required ? 'form-label-required' : ''
  ].filter(Boolean).join(' ');

  return (
    <label className={labelClasses} {...props}>
      {children}
    </label>
  );
};

export default FormLabel;