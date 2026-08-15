import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityCallback = (isConnected: boolean) => void;

export class NetworkListener {
  private unsubscribe: (() => void) | null = null;

  start(onConnectivityChange: ConnectivityCallback): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = !!(state.isConnected && state.isInternetReachable);
      onConnectivityChange(isConnected);
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async checkCurrentStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  }
}
