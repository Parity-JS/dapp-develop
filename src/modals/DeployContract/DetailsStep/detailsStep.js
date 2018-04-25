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

import { AddressSelect, Form, Input, Checkbox, Dropdown } from '@parity/ui/lib';
import { validateAbi } from '@parity/shared/lib/util/validation';
import { parseAbiType } from '@parity/shared/lib/util/abi';

const CHECK_STYLE = {
  marginTop: '1em'
};

export default class DetailsStep extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    accounts: PropTypes.object.isRequired,
    onAbiChange: PropTypes.func.isRequired,
    onAmountChange: PropTypes.func.isRequired,
    onCodeChange: PropTypes.func.isRequired,
    onDescriptionChange: PropTypes.func.isRequired,
    onFromAddressChange: PropTypes.func.isRequired,
    onInputsChange: PropTypes.func.isRequired,
    onNameChange: PropTypes.func.isRequired,
    onParamsChange: PropTypes.func.isRequired,

    abi: PropTypes.string,
    abiError: PropTypes.string,
    amount: PropTypes.string,
    amountError: PropTypes.string,
    code: PropTypes.string,
    codeError: PropTypes.string,
    description: PropTypes.string,
    descriptionError: PropTypes.string,
    fromAddress: PropTypes.string,
    fromAddressError: PropTypes.string,
    name: PropTypes.string,
    nameError: PropTypes.string,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    readOnly: false
  };

  state = {
    solcOutput: '',
    contracts: {},
    selectedContractIndex: 0
  }

  componentDidMount () {
    const { abi, code } = this.props;

    if (abi) {
      this.onAbiChange(abi);
      this.setState({ solcOutput: abi });
    }

    if (code) {
      this.onCodeChange(code);
    }
  }

  render () {
    const {
      accounts,
      readOnly,

      fromAddress, fromAddressError,
      name, nameError,
      description, descriptionError,
      abiError,
      code, codeError
    } = this.props;

    const { solcOutput, contracts } = this.state;
    const solc = contracts && Object.keys(contracts).length > 0;

    return (
      <Form>
        <Input
          autoFocus
          error={ nameError }
          hint={
            <FormattedMessage
              id='deployContract.details.name.hint'
              defaultMessage='A name for the deployed contract'
            />
          }
          label={
            <FormattedMessage
              id='deployContract.details.name.label'
              defaultMessage='Contract name'
            />
          }
          onChange={ this.onNameChange }
          value={ name || '' }
        />

        <Input
          error={ descriptionError }
          hint={
            <FormattedMessage
              id='deployContract.details.description.hint'
              defaultMessage='A description for the contract'
            />
          }
          label={
            <FormattedMessage
              id='deployContract.details.description.label'
              defaultMessage='Contract description (optional)'
            />
          }
          onChange={ this.onDescriptionChange }
          value={ description }
        />

        <AddressSelect
          accounts={ accounts }
          error={ fromAddressError }
          hint={
            <FormattedMessage
              id='deployContract.details.address.hint'
              defaultMessage='The owner account for this contract'
            />
          }
          label={
            <FormattedMessage
              id='deployContract.details.address.label'
              defaultMessage='From account (contract owner)'
            />
          }
          onChange={ this.onFromAddressChange }
          value={ fromAddress }
        />

        { this.renderContractSelect() }

        <Input
          error={ abiError }
          hint={
            <FormattedMessage
              id='deployContract.details.abi.hint'
              defaultMessage='The abi of the contract to deploy or solc combined-output'
            />
          }
          label={
            <FormattedMessage
              id='deployContract.details.abi.label'
              defaultMessage='Abi / solc combined-output'
            />
          }
          onChange={ this.onSolcChange }
          onSubmit={ this.onSolcSubmit }
          readOnly={ readOnly }
          value={ solcOutput }
        />
        <Input
          error={ codeError }
          hint={
            <FormattedMessage
              id='deployContract.details.code.hint'
              defaultMessage='The compiled code of the contract to deploy'
            />
          }
          label={
            <FormattedMessage
              id='deployContract.details.code.label'
              defaultMessage='Code'
            />
          }
          onSubmit={ this.onCodeChange }
          readOnly={ readOnly || solc }
          value={ code }
        />

        { this.renderValueInput() }

      </Form>
    );
  }

  renderValueInput () {
    const { abi, amount, amountError } = this.props;

    let payable = false;

    try {
      const parsedAbi = JSON.parse(abi);

      payable = parsedAbi.find((method) => method.type === 'constructor' && method.payable);
    } catch (error) {
      return null;
    }

    if (!payable) {
      return null;
    }

    return (
      <Input
        error={ amountError }
        hint={
          <FormattedMessage
            id='deployContract.details.amount.hint'
            defaultMessage='The amount to transfer to the contract'
          />
        }
        label={
          <FormattedMessage
            id='deployContract.details.amount.label'
            defaultMessage='Amount to transfer (in {tag})'
            values={ {
              tag: 'ETH'
            } }
          />
        }
        min={ 0 }
        step={ 0.1 }
        type='number'
        onChange={ this.onAmountChange }
        value={ amount }
      />
    );
  }

  renderContractSelect () {
    const { contracts } = this.state;

    if (!contracts || Object.keys(contracts).length === 0) {
      return null;
    }

    const { selectedContractIndex } = this.state;
    const contractsItems = Object
      .keys(contracts)
      .map((name, index) => (
        { text: name, value: index }
      ));

    return (
      <Dropdown
        options={ contractsItems }
        label={
          <FormattedMessage
            id='deployContract.details.contract.label'
            defaultMessage='Select a contract'
          />
        }
        onChange={ this.onContractChange }
        value={ selectedContractIndex }
      />
    );
  }

  onContractChange = (event, index) => {
    const { contracts } = this.state;
    const contractName = Object.keys(contracts)[index];
    const contract = contracts[contractName];

    if (!this.props.name || this.props.name.trim() === '') {
      this.onNameChange(null, contractName);
    }

    const { abi, bin } = contract;
    const code = /^0x/.test(bin)
      ? bin
      : `0x${bin}`;

    this.setState({ selectedContractIndex: index }, () => {
      this.onAbiChange(abi);
      this.onCodeChange(code);
    });
  }

  onSolcChange = (event, value) => {
    // Change triggered only if valid
    if (this.props.abiError) {
      return null;
    }

    this.onSolcSubmit(value);
  }

  onSolcSubmit = (value) => {
    try {
      const solcParsed = JSON.parse(value);

      if (!solcParsed || !solcParsed.contracts) {
        throw new Error('Wrong solc output');
      }

      this.setState({ contracts: solcParsed.contracts }, () => {
        this.onContractChange(null, 0);
      });
    } catch (e) {
      this.setState({ contracts: null });
      this.onAbiChange(value);
    }

    this.setState({ solcOutput: value });
  }

  onFromAddressChange = (event, fromAddress) => {
    const { onFromAddressChange } = this.props;

    onFromAddressChange(fromAddress);
  }

  onNameChange = (event, name) => {
    const { onNameChange } = this.props;

    onNameChange(name);
  }

  onDescriptionChange = (event, description) => {
    const { onDescriptionChange } = this.props;

    onDescriptionChange(description);
  }

  onAmountChange = (event, value) => {
    const { onAmountChange } = this.props;

    onAmountChange(value);
  }

  onAbiChange = (abi) => {
    const { api } = this.context;
    const { onAbiChange, onParamsChange, onInputsChange } = this.props;
    const { abiError, abiParsed } = validateAbi(abi, api);

    if (!abiError) {
      const { inputs } = abiParsed
        .find((method) => method.type === 'constructor') || { inputs: [] };

      const params = [];

      inputs.forEach((input) => {
        const param = parseAbiType(input.type);

        params.push(param.default);
      });

      onParamsChange(params);
      onInputsChange(inputs);
    } else {
      onParamsChange([]);
      onInputsChange([]);
    }

    onAbiChange(abi);
  }

  onCodeChange = (code) => {
    const { onCodeChange } = this.props;

    onCodeChange(code);
  }
}
