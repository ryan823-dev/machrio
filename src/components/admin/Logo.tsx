'use client'
import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}
    >
      <img
        src="/machrio-icon.png"
        alt="Machrio"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
        }}
      />
      <span
        style={{
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        <span style={{ color: '#1e293b' }}>Mach</span>
        <span style={{ color: '#F59E0B' }}>rio</span>
      </span>
    </div>
  )
}
