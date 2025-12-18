import { MobileControler } from '../../../mobile/index.js';

/**
 * AppMobileTrace class
 * Tracks mobile app usage and screen state dynamically
 * Designed to be passed as context and maintain mutable state
 */
export class AppMobileTrace {
  private mobileController: MobileControler;
  private deviceId: string;
  private authorizedApps: Array<{ name: string; identifier: string }>;
  private appTimeline: Array<{
    name: string;
    last_used?: Date;
    current_session_start?: Date;
  }>;
  private currentScreenWindow: string = '';

  constructor(
    mobileController: MobileControler,
    deviceId: string,
    authorizedApps: Array<{ name: string; identifier: string }>
  ) {
    this.mobileController = mobileController;
    this.deviceId = deviceId;
    this.authorizedApps = authorizedApps;

    // Initialize appTimeline
    this.appTimeline = authorizedApps.map(app => ({
      name: app.name,
      last_used: undefined,
      current_session_start: undefined,
    }));

    console.log('✅ AppMobileTrace initialized with apps:', authorizedApps);
  }

  /**
   * Update the current screen window and app timeline
   * This method is called before each model invocation
   */
  async updateState(): Promise<void> {
    try {
      // Fetch current screen elements
      this.currentScreenWindow = await this.mobileController.getScreenElements(
        this.deviceId
      );
      console.log('📱 Updated currentScreenWindow');

      // Track app timeline based on screen elements
      if (this.currentScreenWindow) {
        const currentApp = this.authorizedApps.find(app =>
          this.currentScreenWindow
            .toLowerCase()
            .includes(app.identifier.toLowerCase())
        );

        console.log(
          `📱 App Detection: ${currentApp ? `Found ${currentApp.name}` : 'No app detected in screen elements'}`
        );

        const now = new Date();
        this.appTimeline = this.appTimeline.map(timelineEntry => {
          const appInfo = this.authorizedApps.find(
            app => app.name === timelineEntry.name
          );

          if (!appInfo) return timelineEntry;

          if (currentApp && currentApp.name === timelineEntry.name) {
            // This is the current app - set or maintain current_session_start
            return {
              name: timelineEntry.name,
              last_used: timelineEntry.last_used,
              current_session_start:
                timelineEntry.current_session_start || now,
            };
          } else {
            // Not the current app
            if (timelineEntry.current_session_start) {
              // Was active before, now not active - update last_used and clear current_session_start
              return {
                name: timelineEntry.name,
                last_used: now,
                current_session_start: undefined,
              };
            }
            // Was not active, keep as is
            return timelineEntry;
          }
        });

        console.log('✅ Updated appTimeline:', this.appTimeline);
      }
    } catch (error) {
      console.error(
        '❌ Error updating AppMobileTrace state:',
        error instanceof Error ? error.message : String(error)
      );
      this.currentScreenWindow = 'Screen data unavailable';
    }
  }

  /**
   * Get the current screen window
   */
  getCurrentScreenWindow(): string {
    return this.currentScreenWindow || 'No screen data available';
  }

  /**
   * Get the formatted app timeline for display in prompt
   */
  getFormattedAppTimeline(): string {
    if (!this.appTimeline || this.appTimeline.length === 0) {
      return 'No app usage data available yet.';
    }

    return this.appTimeline
      .map(app => {
        const parts = [`- ${app.name}`];

        if (app.current_session_start) {
          const duration = Math.floor(
            (Date.now() - app.current_session_start.getTime()) / 1000
          );
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          parts.push(`(Currently active for ${minutes}m ${seconds}s)`);
        } else if (app.last_used) {
          const timeSince = Math.floor(
            (Date.now() - app.last_used.getTime()) / 1000
          );
          const minutes = Math.floor(timeSince / 60);
          parts.push(`(Last used ${minutes}m ago)`);
        } else {
          parts.push('(Not used yet)');
        }

        return parts.join(' ');
      })
      .join('\n');
  }

  /**
   * Get the raw app timeline data
   */
  getAppTimeline(): Array<{
    name: string;
    last_used?: Date;
    current_session_start?: Date;
  }> {
    return this.appTimeline;
  }
}
