import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import ConfirmationModal from '../components/ConfirmationModal';
import SyntheticNotice from '../components/SyntheticNotice';
import Footer from '../components/Footer';

describe('Frontend Component & Workflow Tests', () => {
  it('renders StatusBadge correctly for urgency, approval, request, and alert states', () => {
    const { rerender } = render(<StatusBadge type="urgency" value="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();

    rerender(<StatusBadge type="urgency" value="NORMAL" />);
    expect(screen.getByText('NORMAL')).toBeInTheDocument();

    rerender(<StatusBadge type="approval" value="APPROVED" />);
    expect(screen.getByText(/Verified/i)).toBeInTheDocument();

    rerender(<StatusBadge type="approval" value="PENDING" />);
    expect(screen.getByText(/Pending Approval/i)).toBeInTheDocument();

    rerender(<StatusBadge type="approval" value="REJECTED" />);
    expect(screen.getByText(/Rejected/i)).toBeInTheDocument();

    rerender(<StatusBadge type="request" value="ACTIVE" />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    rerender(<StatusBadge type="alert" value="ACCEPTED" />);
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument();

    rerender(<StatusBadge type="alert" value="DECLINED" />);
    expect(screen.getByText('DECLINED')).toBeInTheDocument();
  });

  it('renders CountdownTimer with formatted remaining time and handles past deadlines', () => {
    const futureDate = new Date(Date.now() + 3600000 * 2).toISOString();
    const { rerender } = render(<CountdownTimer targetDate={futureDate} />);
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();

    const pastDate = new Date(Date.now() - 3600000).toISOString();
    rerender(<CountdownTimer targetDate={pastDate} />);
    expect(screen.getByText(/Required by time passed/i)).toBeInTheDocument();
  });

  it('renders ConfirmationModal with messages and triggers callbacks', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Modal Title"
        message="Are you sure you want to proceed?"
        confirmLabel="Proceed Now"
        cancelLabel="Dismiss"
        isDangerous={true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Proceed Now'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Dismiss'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders SyntheticNotice and handles user dismissal', () => {
    render(<SyntheticNotice />);
    expect(screen.getByText(/Hackathon Demo Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic simulations/i)).toBeInTheDocument();

    const dismissBtn = screen.getByTitle('Dismiss notice');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/Hackathon Demo Mode/i)).not.toBeInTheDocument();
  });

  it('renders Footer with medical safety disclaimer and synthetic demo architecture', () => {
    render(<Footer />);
    expect(screen.getByText(/Medical Safety Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Final blood-group compatibility and transfusion suitability/i)).toBeInTheDocument();
    expect(screen.getByText(/100% synthetic mock dataset/i)).toBeInTheDocument();
  });
});
