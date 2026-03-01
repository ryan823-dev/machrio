'use client'
import React from 'react'

export const Icon: React.FC = () => {
  return (
    <img
      src="/machrio-icon.png"
      alt="Machrio"
      style={{
        width: '25px',
        height: '25px',
        borderRadius: '5px',
        objectFit: 'contain',
      }}
    />
  )
}
