// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import 'whatwg-fetch';

import es6Promise from 'es6-promise';

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { hashHistory } from 'react-router';

import Api from '@parity/api';

// import ContractInstances from '@parity/shared/lib/contracts';

import { initStore } from '@parity/shared/lib/redux';
import ContextProvider from '@parity/ui/lib/ContextProvider';
import MainApplication from './main';

import { loadSender, patchApi } from '@parity/shared/lib/util/tx';
import { setApi } from '@parity/shared/lib/redux/providers/apiActions';

es6Promise.polyfill();

const ethereumProvider = window.ethereum;

if (!ethereumProvider) {
  throw new Error('Unable to locate EthereumProvider, object not attached');
}

const api = new Api(ethereumProvider);

patchApi(api); // @TODO Not sure what those are for
loadSender(api);
// ContractInstances.create(api);

const store = initStore(api, hashHistory);

store.dispatch({ type: 'initAll', api });
store.dispatch(setApi(api));

ReactDOM.render(
  <AppContainer>
    <ContextProvider api={ api } store={ store }>
      <MainApplication
        routerHistory={ hashHistory }
      />
    </ContextProvider>
  </AppContainer>,
  document.querySelector('#root')
);

if (module.hot) {
  module.hot.accept('./main.js', () => {
    require('./main.js');
    ReactDOM.render(
      <AppContainer>
        <ContextProvider api={ api } store={ store }>
          <MainApplication
            routerHistory={ hashHistory }
          />
        </ContextProvider>
      </AppContainer>,
      document.querySelector('#root')
    );
  });
}
