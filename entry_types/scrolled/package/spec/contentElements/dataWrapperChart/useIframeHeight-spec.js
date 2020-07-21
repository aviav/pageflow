import {useIframeHeight} from '../../../src/contentElements/dataWrapperChart/useIframeHeight'

import {renderHook} from '@testing-library/react-hooks';
import {fakeParentWindow, tick} from 'support';
import {act} from '@testing-library/react';

describe('useIframeHeight', () => {
  it('sets the default height', async () => {
    const testURL = 'https://datawrapper.dwcdn.net/CXXQo/1/';
    fakeParentWindow();

    const {result} = renderHook(() => useIframeHeight(testURL));

    window.postMessage('SOME_MESSAGE', '*');
    await tick();
       
    expect(result.current).toEqual('400px');
  });
});