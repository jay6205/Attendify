import React from 'react';
import { motion } from 'framer-motion';

const ScaleButton = ({ children, onClick, className, disabled, title, ...props }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
            disabled={disabled}
            className={className}
            title={title}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default ScaleButton;
