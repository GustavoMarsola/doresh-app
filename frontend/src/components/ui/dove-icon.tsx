import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDove } from '@fortawesome/free-solid-svg-icons';

interface DoveIconProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const sizeMap = {
	sm: 'w-5 h-5',
	md: 'w-7 h-7',
	lg: 'w-10 h-10',
};

export const DoveIcon: React.FC<DoveIconProps> = ({ size = 'md', className = '' }) => {
	return (
		<div className={`text-inherit ${sizeMap[size]} ${className}`}>
			<FontAwesomeIcon icon={faDove} className="w-full h-full" />
		</div>
	);
};
