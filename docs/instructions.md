# Voice-to-Text Transcription Feature: Step-by-Step Implementation Plan: Project Requirements & Instructions

1. Create a voice-to-text transcription feature for Poppy AI
2. Use Assembly AI for transcription
3. Implement live streaming transcription (not batch processing)
4. Create a simple UI with a text block and a record button
5. Record a Loom video demonstrating the app
6. Send the Loom video via text message to the provided number

## Setup Phase

1. Create a new Next.js project with TypeScript using `npx create-next-app@latest`
2. Set up Tailwind CSS for styling (already configured in Next.js setup)
3. Create an Assembly AI account and get an API key
4. Install necessary dependencies:
   - `axios` for API requests
   - `react-use` for hooks
   - `zod` for validation

## Development Phase

5. Create environment variables for API keys
6. Implement the audio recording functionality:
   - Create a custom hook `useAudioRecorder` to manage recording state
   - Implement the WebAudio API to capture microphone input
   - Set up audio chunking for real-time transmission

7. Implement Assembly AI integration:
   - Create a transcription service
   - Set up a WebSocket connection to Assembly AI for streaming
   - Handle the streaming response and update the UI in real-time

8. Build the UI components:
   - Create an AI agent chat interface (use Vercel/21st.dev/a0.dev/simple-ai boilerplate)
   - Create a transcription container component
   - Implement a record button with active/inactive states
   - Create a text display area for the transcription
   - Add visual feedback during recording

9. Handle error cases:
   - Microphone permissions denied
   - API connection failures
   - Browser compatibility issues

## Testing & Refinement

10. Test the application across different browsers
11. Optimize the UI for responsiveness
12. Implement loading states for better UX
13. Add error handling and user feedback

## Deployment & Demonstration

14. Deploy the application (Vercel recommended for Next.js)
15. Record a Loom video demonstrating:
    - The application setup
    - Starting a recording
    - Showing the live transcription working
    - Stopping the recording
    - Displaying the final transcription

16. Text the Loom video to +1-248-880-8895 as instructed

## Additional Considerations

17. Implement token management for Assembly AI
18. Add a feature to save transcriptions
19. Consider implementing pause/resume functionality
20. Add a visual indicator for audio levels during recording

This implementation plan covers all the requirements and adds a few enhancements that would make the application more robust and user-friendly.
