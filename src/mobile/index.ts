import { DynamicStructuredTool } from 'langchain';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  type: string;
  version: string;
  state: string;
  screenWidth?: number;
  screenHeight?: number;
}

export class MobileControler {
  private tools: DynamicStructuredTool[];
  constructor(tools: DynamicStructuredTool[]) {
    this.tools = tools;
  }

  public async getDevices(): Promise<DeviceInfo[]> {
    try {
      const listMobileTool = this.tools.find(
        tool => tool.name === 'mobile_list_available_devices'
      );
      if (!listMobileTool) {
        throw new Error('Tool mobile_list_available_devices not found');
      }
      const listDevices = await listMobileTool.invoke({ noParams: {} });
      if (!listDevices) {
        throw new Error('Error invoking mobile_list_available_devices tool');
      }
      const devices = JSON.parse(listDevices);
      return devices.devices as DeviceInfo[];
    } catch (error) {
      throw error;
    }
  }

  public async getScreenElements(deviceId: string): Promise<string> {
    try {
      const getScreenElementsTool = this.tools.find(
        tool => tool.name === 'mobile_list_elements_on_screen'
      );
      if (!getScreenElementsTool) {
        throw new Error('Tool mobile_list_elements_on_screen not found');
      }
      const screenElementsStr = await getScreenElementsTool.invoke({
        device: deviceId,
      });
      if (!screenElementsStr) {
        throw new Error('Error invoking mobile_list_elements_on_screen tool');
      }

      // Remove "Found these elements on screen:" prefix if present
      const cleanedStr = screenElementsStr.replace(
        /^Found these elements on screen:\s*/i,
        ''
      );
      return cleanedStr;
    } catch (error) {
      throw error;
    }
  }

  public async getDevicesScreenSize(
    deviceId: string
  ): Promise<{ width: number; height: number }> {
    try {
      const getScreenSizeTool = this.tools.find(
        tool => tool.name === 'mobile_get_screen_size'
      );
      if (!getScreenSizeTool) {
        throw new Error('Tool mobile_get_screen_size not found');
      }
      const screenSizeStr = await getScreenSizeTool.invoke({
        device: deviceId,
      });
      if (!screenSizeStr) {
        throw new Error('Error invoking mobile_get_screen_size tool');
      }

      // Parse format: "Screen size is WxH pixels" or "Screen size is W×H pixels"
      const match = screenSizeStr.match(/(\d+)\s*[x×]\s*(\d+)/i);
      if (!match) {
        throw new Error(`Unable to parse screen size from: ${screenSizeStr}`);
      }

      return {
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
      };
    } catch (error) {
      throw error;
    }
  }
}
