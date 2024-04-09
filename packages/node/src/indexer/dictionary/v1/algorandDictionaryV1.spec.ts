// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NETWORK_FAMILY } from '@subql/common';
import { DictionaryService, NodeConfig } from '@subql/node-core';
import { MetaData } from '@subql/utils';
import { AlgorandDictionaryV1 } from './algorandDictionaryV1';

const nodeConfig = {
  dictionaryTimeout: 10000,
  dictionaryRegistry:
    'https://github.com/subquery/templates/raw/main/dist/dictionary.json',
} as NodeConfig;
const project = {
  network: {
    chainId: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  },
} as any;

class TestDictionaryService extends DictionaryService<any, any> {
  async initDictionaries(): Promise<void> {
    return Promise.resolve(undefined);
  }
  async getRegistryDictionaries(chainId: string): Promise<string[]> {
    return this.resolveDictionary(
      NETWORK_FAMILY.algorand,
      chainId,
      this.nodeConfig.dictionaryRegistry,
    );
  }
}
describe('dictionary v1', () => {
  let dictionary: AlgorandDictionaryV1;
  beforeEach(async () => {
    const testDictionaryService = new TestDictionaryService(
      project.network.chainId,
      nodeConfig,
      new EventEmitter2(),
    );
    const dictionaryEndpoints =
      await testDictionaryService.getRegistryDictionaries(
        project.network.chainId,
      );
    dictionary = await AlgorandDictionaryV1.create(
      {
        network: {
          chainId: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
          dictionary: dictionaryEndpoints[1],
        },
      } as any,
      { dictionaryTimeout: 10000 } as NodeConfig,
      jest.fn(),
      dictionaryEndpoints[1], // use endpoint from network
    );
  });

  it('successfully validates metatada', () => {
    // start height from metadata
    expect(dictionary.startHeight).toBe(1);
    // further validation
    expect(
      (dictionary as any).dictionaryValidation(
        {
          lastProcessedHeight: 10000,
          targetHeight: 10000,
          chain: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
          genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
          startHeight: 1,
        } as MetaData,
        1,
      ),
    ).toBeTruthy();
  });
});
