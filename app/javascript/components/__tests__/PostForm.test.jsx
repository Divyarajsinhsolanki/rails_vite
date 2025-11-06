import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PostForm from '../PostForm';

vi.mock('../api', () => ({
  createPost: vi.fn()
}));

const toastMock = {
  success: vi.fn(),
  error: vi.fn()
};

vi.mock('react-hot-toast', () => ({
  default: toastMock
}));

describe('PostForm dropzone', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renders image preview after dropping a valid image without console warnings', () => {
    render(<PostForm refreshPosts={vi.fn()} />);

    const dropzone = screen.getByTestId('post-form-dropzone');
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('shows a toast error when a non-image file is dropped', () => {
    render(<PostForm refreshPosts={vi.fn()} />);

    const dropzone = screen.getByTestId('post-form-dropzone');
    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(toastMock.error).toHaveBeenCalledWith('Please upload a valid image file');
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });
});
