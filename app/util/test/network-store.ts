/* eslint-disable @typescript-eslint/no-explicit-any -- TODO: Type legacy network store fixtures. */
import axios from 'axios';
import { Platform } from 'react-native';
import { getFixturesServerPortInApp } from './utils';

const FETCH_TIMEOUT = 40000; // Timeout in milliseconds

// Configure Axios with CORS headers
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] =
  'GET, POST, PUT, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] =
  'Origin, X-Requested-With, Content-Type, Accept';

const fetchWithTimeout = (url: any) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, FETCH_TIMEOUT);
  });

class ReadOnlyNetworkStore {
  _asyncState: any;
  _initialized: any;
  _state: any;
  constructor() {
    this._initialized = false;
    this._state = undefined;
    this._asyncState = undefined;
  }

  // Redux Store
  async getState() {
    await this._initIfRequired();
    return this._state;
  }

  async setState(state: any) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    await this._initIfRequired();
    this._state = state;
  }

  // Async Storage
  async getString(key: any) {
    await this._initIfRequired();
    const value = this._asyncState[key];
    return value !== undefined ? value : null;
  }

  async set(key: any, value: any) {
    await this._initIfRequired();
    this._asyncState[key] = value;
  }

  async delete(key: any) {
    await this._initIfRequired();
    delete this._asyncState[key];
  }

  async clearAll() {
    await this._initIfRequired();
    delete this._asyncState;
  }

  async getAllKeys() {
    await this._initIfRequired();
    return Object.keys(this._asyncState || {});
  }

  async multiGet(keys: any) {
    await this._initIfRequired();
    return keys.map((key: any) => [key, this._asyncState?.[key] ?? null]);
  }

  async _initIfRequired() {
    if (!this._initialized) {
      await this._init();
    }
  }

  async _init() {
    // Dynamically get the port (works on iOS via LaunchArgs, fallback on Android)
    const port = getFixturesServerPortInApp();
    const isAndroid = Platform.OS === 'android';

    // Build comprehensive URL list to try in order of likelihood:
    // 1. localhost with actual port (works on iOS, might work on Android with adb reverse)
    // 2. 10.0.2.2 with actual port (Android emulator host, direct access without adb reverse!)
    // 3. bs-local.com (BrowserStack)
    const urls = [`http://localhost:${port}/state.json`];

    // Android emulator can access host via 10.0.2.2 without adb reverse
    if (isAndroid) {
      urls.push(`http://10.0.2.2:${port}/state.json`);
    }

    // BrowserStack uses bs-local.com
    urls.push(`http://bs-local.com:${port}/state.json`);

    try {
      for (const url of urls) {
        try {
          const response = await fetchWithTimeout(url);
          if ((response as any).status === 200) {
            this._state = (response as any).data?.state;
            this._asyncState = (response as any).data?.asyncState;
            // eslint-disable-next-line no-console
            console.debug(`Successfully loaded fixture state from ${url}`);
            return;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.debug(`Error loading network state from ${url}: '${error}'`);
          // Continue to next URL if this one failed
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug(`Error loading network state: '${error}'`);
    } finally {
      this._initialized = true;
    }
  }
}

export default new ReadOnlyNetworkStore();
