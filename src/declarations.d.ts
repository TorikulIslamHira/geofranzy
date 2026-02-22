/**
 * Global type declarations for assets and modules
 * used in cross-platform (web + RN) source files
 */

// CSS Module declarations
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// Image asset declarations
declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.jpeg' {
  const value: number;
  export default value;
}

declare module '*.gif' {
  const value: number;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const content: string;
  export default content;
}

// Navigation packages (types bundled in packages themselves)
declare module '@react-navigation/native';
declare module '@react-navigation/stack';
declare module '@react-navigation/bottom-tabs';

// React Native community packages
declare module 'react-native-safe-area-context';
declare module 'react-native-gesture-handler';
declare module 'react-native-screens';
declare module 'react-native-maps';
