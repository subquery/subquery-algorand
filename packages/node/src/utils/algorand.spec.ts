// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { NodeConfig } from '@subql/node-core';
import { GraphQLSchema } from 'graphql';
import { SubqueryProject } from '../configure/SubqueryProject';
import { ApiService } from '../indexer/api.service';
import { filterTransaction, getBlockByHeight } from './algorand';

// const ENDPOINT = 'https://algoindexer.algoexplorerapi.io';
const testNetEndpoint = 'https://algoindexer.testnet.algoexplorerapi.io';

function testSubqueryProject(endpoint: string): SubqueryProject {
  return {
    network: {
      endpoint,
      dictionary: `https://api.subquery.network/sq/subquery/Algorand-Dictionary`,
    },
    dataSources: [],
    id: 'test',
    root: './',
    schema: new GraphQLSchema({}),
    templates: [],
  };
}

jest.setTimeout(90000);
describe('Algorand RPC', () => {
  let app: INestApplication;

  const prepareApiService = async (
    endpoint: string = testNetEndpoint,
  ): Promise<ApiService> => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'ISubqueryProject',
          useFactory: () => testSubqueryProject(endpoint),
        },
        NodeConfig,
        ApiService,
      ],
      imports: [EventEmitterModule.forRoot()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const apiService = app.get(ApiService);
    await apiService.init();
    return apiService;
  };

  afterAll(() => {
    return app?.close();
  });

  it('Can filter acfg with sender', () => {
    const tx = {
      assetConfigTransaction: {
        assetId: 0,
        params: {
          clawback:
            '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          creator: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          decimals: 0,
          defaultFrozen: false,
          freeze: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          manager: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          name: 'flowTest.algo',
          nameB64: 'Zmxvd1Rlc3QuYWxnbw==',
          reserve: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          total: 1,
          unitName: 'xAns',
          unitNameB64: 'eEFucw==',
          url: 'https://xgov.app',
          urlB64: 'aHR0cHM6Ly94Z292LmFwcA==',
        },
      },
      closeRewards: 0,
      closingAmount: 0,
      confirmedRound: 27081666,
      createdAssetIndex: 154583116,
      fee: 1000,
      firstValid: 27081664,
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      genesisId: 'testnet-v1.0',
      id: '5CUFVHAA7XZFZDRXO5J2Q26O6O4KB6DHSOB54P5LO3S57S2JF5NA',
      intraRoundOffset: 12,
      lastValid: 27082664,
      receiverRewards: 0,
      roundTime: 1674020229,
      sender: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
      senderRewards: 0,
      signature: {
        sig: 'rawhKc26WQe98vKweozDOJmH32c60fI83ddi5kwXg2BYu8EJCh0V3dlzRkOcY/4C3Gh7Bkzi12Yte9EejE1QBw==',
      },
      txType: 'acfg',
    };

    expect(
      filterTransaction(tx as any, {
        txType: 'acfg',
        sender: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
      }),
    ).toBe(true);
  });
  it('test large blocks', async () => {
    const apiService = await prepareApiService();

    const api = apiService.getApi();

    const fetchBlock = async () => {
      await getBlockByHeight(api, 27739202);
    };

    expect(fetchBlock).not.toThrow();
    const result = await fetchBlock();
    expect(result).toBeDefined();
  });
});
