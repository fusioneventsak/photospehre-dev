# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Real-time photo updates using Supabase Realtime
- Debug panel for monitoring real-time events
- SlotManager class for stable photo positioning
- Fallback polling mechanism when WebSockets fail
- Connection status indicators in UI
- Pattern-specific settings for different animation types
- Comprehensive test scripts for real-time functionality
- Supabase migrations for enabling Realtime
- Enhanced moderation interface with photo preview

### Fixed
- Routing issue with /dashboard typo
- Syntax error in App.tsx
- Photo deletion not updating UI immediately
- Inconsistent photo positioning during animations
- Memory leaks in 3D scene components
- Realtime subscription not cleaning up properly
- Empty slot color not applying correctly
- Camera controls not working on mobile devices

### Changed
- Improved photo state management for real-time updates
- Enhanced error handling for photo uploads and deletions
- Optimized 3D rendering for better performance
- Updated lighting system for better photo visibility
- Refactored animation patterns to support pattern-specific settings
- Improved moderation workflow with better feedback

### Removed
- Redundant photo fetching on component mount
- Unnecessary re-renders in photo components
- Duplicate event listeners in 3D scene

## [0.1.0] - 2025-06-25

### Added
- Initial project setup
- Basic 3D scene with React Three Fiber
- Photo upload functionality
- Collage management system
- User authentication
- Basic moderation capabilities