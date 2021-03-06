// Copyright 2015-2018 Parity Technologies (UK) Ltd.
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

import PropTypes from 'prop-types';

import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import { AddressSelect, Form, Input, TypedInput, Dropdown } from '@parity/ui/lib';

import styles from '../executeContract.css';

export default class DetailsStep extends Component {
  static propTypes = {
    accounts: PropTypes.object.isRequired,
    amount: PropTypes.string,
    amountError: PropTypes.string,
    contract: PropTypes.object.isRequired,
    fromAddress: PropTypes.string,
    fromAddressError: PropTypes.string,
    func: PropTypes.object,
    funcError: PropTypes.string,
    onAmountChange: PropTypes.func.isRequired,
    onFromAddressChange: PropTypes.func.isRequired,
    onFuncChange: PropTypes.func,
    onValueChange: PropTypes.func.isRequired,
    values: PropTypes.array.isRequired,
    valuesError: PropTypes.array.isRequired
  }

  render () {
    const { accounts, amount, amountError, fromAddress, fromAddressError, onAmountChange, onFromAddressChange } = this.props;

    return (
      <Form>
        <AddressSelect
          accounts={ accounts }
          error={ fromAddressError }
          hint={
            <FormattedMessage
              id='executeContract.details.address.label'
              defaultMessage='The account to transact with'
            />
          }
          label={
            <FormattedMessage
              id='executeContract.details.address.hint'
              defaultMessage='From account'
            />
          }
          onChange={ onFromAddressChange }
          value={ fromAddress }
        />
        { this.renderFunctionSelect() }
        { this.renderParameters() }
        <div className={ styles.columns }>
          <div>
            <Input
              error={ amountError }
              hint={
                <FormattedMessage
                  id='executeContract.details.amount.hint'
                  defaultMessage='The amount to send to with the transaction'
                />
              }
              label={
                <FormattedMessage
                  id='executeContract.details.amount.label'
                  defaultMessage='Transaction value (in ETH)'
                />
              }
              onSubmit={ onAmountChange }
              value={ amount }
            />
          </div>
        </div>
      </Form>
    );
  }

  renderFunctionSelect () {
    const { func, funcError, contract } = this.props;

    if (!func) {
      return null;
    }

    const functions = contract.functions
      .filter((func) => !func.constant)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((func) => {
        const params = (func.abi.inputs || [])
          .map((input, index) => {
            return (
              <span key={ input.name }>
                <span>{ index ? ', ' : '' }</span>
                <span className={ styles.paramname }>{ input.name }: </span>
                <span>{ input.type }</span>
              </span>
            );
          });

        const name = (
          <div>
            <span>{ func.name }</span>
            <span className={ styles.paramname }>(</span>
            { params }
            <span className={ styles.paramname }>)</span>
          </div>
        );

        // (previously func.name as label, name as content)
        return { text: name || '()', name: func.name, value: func.signature };
      });

    return (
      <Dropdown
        error={ funcError }
        hint={
          <FormattedMessage
            id='executeContract.details.function.hint'
            defaultMessage='The function to call on the contract'
          />
        }
        label={
          <FormattedMessage
            id='executeContract.details.function.label'
            defaultMessage='Function to execute'
          />
        }
        options={ functions }
        onChange={ this.onFuncChange }
        search={ this.searchFn }
        value={ func.signature }
      />
    );
  }

  searchFn (options, query) {
    return options.filter(({ name }) => name && name.toLowerCase().includes(query.toLowerCase()));
  }

  renderParameters () {
    const { accounts, func, values, valuesError, onValueChange } = this.props;

    if (!func) {
      return null;
    }

    return (func.abi.inputs || []).map((input, index) => {
      const onChange = (value) => onValueChange(null, index, value);
      const label = `${input.name}: ${input.type}`;

      return (
        <div
          key={ `${index}_${input.name || ''}` }
          className={ styles.funcparams }
        >
          <TypedInput
            label={ label }
            value={ values[index] }
            error={ valuesError[index] }
            onChange={ onChange }
            accounts={ accounts }
            param={ input.type }
            isEth={ false }
          />
        </div>
      );
    });
  }

  onFuncChange = (event, signature) => {
    const { contract, onFuncChange } = this.props;

    onFuncChange(event, contract.functions.find((fn) => fn.signature === signature));
  }
}
