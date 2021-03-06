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

import { observer } from 'mobx-react';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styles from './addContract.css';

import { newError } from '@parity/shared/lib/redux/actions';
import { Button, Form, Input, InputAddress, InputChip, Portal, RadioButtons } from '@parity/ui/lib';
import { AddIcon, CancelIcon, NextIcon, PrevIcon } from '@parity/ui/lib/Icons';

import Store from './store';

@observer
class AddContract extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  }

  static propTypes = {
    contracts: PropTypes.object.isRequired,
    newError: PropTypes.func.isRequired,
    onClose: PropTypes.func
  };

  store = new Store(this.context.api, this.props.contracts);

  render () {
    const { step } = this.store;

    return (
      <Portal
        activeStep={ step }
        buttons={ this.renderDialogActions() }
        onClose={ this.onClose }
        open
        steps={ [
          <FormattedMessage
            id='addContract.title.type'
            defaultMessage='Choose a contract type'
            key='type'
          />,
          <FormattedMessage
            id='addContract.title.details'
            defaultMessage='Enter contract details'
            key='details'
          />
        ] }
      >
        { this.renderStep() }
      </Portal>
    );
  }

  renderStep () {
    const { step } = this.store;

    switch (step) {
      case 0:
        return this.renderContractTypeSelector();

      default:
        return this.renderFields();
    }
  }

  renderContractTypeSelector () {
    const { abiTypeIndex, abiTypes } = this.store;

    return (
      <RadioButtons
        className={ styles.radio }
        name='contractType'
        value={ abiTypeIndex }
        values={ abiTypes.map((abiType, i) => ({ ...abiType, key: i })) }
        onChange={ this.onChangeABIType }
      />
    );
  }

  renderDialogActions () {
    const { step } = this.store;

    const cancelBtn = (
      <Button
        icon={ <CancelIcon /> }
        key='cancel'
        label={
          <FormattedMessage
            id='addContract.button.cancel'
            defaultMessage='Cancel'
          />
        }
        onClick={ this.onClose }
      />
    );

    if (step === 0) {
      return [
        cancelBtn,
        <Button
          icon={ <NextIcon /> }
          key='next'
          label={
            <FormattedMessage
              id='addContract.button.next'
              defaultMessage='Next'
            />
          }
          onClick={ this.onNext }
        />
      ];
    }

    return [
      cancelBtn,
      <Button
        icon={ <PrevIcon /> }
        key='prev'
        label={
          <FormattedMessage
            id='addContract.button.prev'
            defaultMessage='Back'
          />
        }
        onClick={ this.onPrev }
      />,
      <Button
        icon={ <AddIcon /> }
        key='add'
        label={
          <FormattedMessage
            id='addContract.button.add'
            defaultMessage='Add Contract'
          />
        }
        disabled={ this.store.hasError }
        onClick={ this.onAdd }
      />
    ];
  }

  renderFields () {
    const { abi, abiError, abiType, address, addressError, description, name, nameError, tags } = this.store;

    return (
      <Form>
        <InputAddress
          autoFocus
          error={ addressError }
          hint={
            <FormattedMessage
              id='addContract.address.hint'
              defaultMessage='The network address for the contract'
            />
          }
          label={
            <FormattedMessage
              id='addContract.address.label'
              defaultMessage='Network address'
            />
          }
          onChange={ this.onChangeAddress }
          onSubmit={ this.onEditAddress }
          value={ address }
        />
        <Input
          error={ nameError }
          hint={
            <FormattedMessage
              id='addContract.name.hint'
              defaultMessage='A descriptive name for the contract'
            />
          }
          label={
            <FormattedMessage
              id='addContract.name.label'
              defaultMessage='Contract name'
            />
          }
          onSubmit={ this.onEditName }
          value={ name }
        />
        <Input
          hint={
            <FormattedMessage
              id='addContract.description.hint'
              defaultMessage='An expanded description for the entry'
            />
          }
          label={
            <FormattedMessage
              id='addContract.description.label'
              defaultMessage='(optional) Contract description'
            />
          }
          onSubmit={ this.onEditDescription }
          value={ description }
        />
        <InputChip
          addOnBlur
          hint={
            <FormattedMessage
              id='addContract.description.tags.hint'
              defaultMessage='Press <Enter> to add a tag'
            />
          }
          label={
            <FormattedMessage
              id='addContract.description.tags.label'
              defaultMessage='(optional) Tags'
            />
          }
          onTokensChange={ this.onEditTags }
          tokens={ tags.slice() }
        />
        <Input
          error={ abiError }
          hint={
            <FormattedMessage
              id='addContract.abi.hint'
              defaultMessage='The abi for the contract'
            />
          }
          label={
            <FormattedMessage
              id='addContract.abi.label'
              defaultMessage='Contract abi'
            />
          }
          onSubmit={ this.onEditAbi }
          readOnly={ abiType.readOnly }
          value={ abi }
        />
      </Form>
    );
  }

  onNext = () => {
    this.store.nextStep();
  }

  onPrev = () => {
    this.store.prevStep();
  }

  onChangeABIType = (value, index) => {
    this.store.setAbiTypeIndex(index);
  }

  onEditAbi = (abi) => {
    this.store.setAbi(abi);
  }

  onChangeAddress = (event, address) => {
    this.onEditAddress(address);
  }

  onEditAddress = (address) => {
    this.store.setAddress(address);
  }

  onEditDescription = (description) => {
    this.store.setDescription(description);
  }

  onEditName = (name) => {
    this.store.setName(name);
  }

  onEditTags = (tags) => {
    this.store.setTags(tags);
  }

  onAdd = () => {
    return this.store
      .addContract()
      .then(() => {
        this.onClose();
      })
      .catch((error) => {
        this.props.newError(error);
      });
  }

  onClose = () => {
    this.props.onClose();
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    newError
  }, dispatch);
}

export default connect(
  null,
  mapDispatchToProps
)(AddContract);
