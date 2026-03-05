/**
 * Preload Critical Assets
 * This script runs before the app loads to prefetch critical resources
 */

// Preconnect to external domains
const preconnects = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Create preload links
preconnects.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
});

// Prefetch critical fonts
const fonts = [
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

fonts.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
});
