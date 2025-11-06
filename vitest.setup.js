import '@testing-library/jest-dom';

// Provide a stable mock for URL.createObjectURL used in file previews.
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = () => 'blob:mock-url';
}
