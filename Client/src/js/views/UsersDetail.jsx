import React from 'react';

import { connect } from 'react-redux';

import { Well, Row, Col, Alert, Label, Button, Glyphicon, Popover, Form, FormGroup, HelpBlock, ButtonGroup } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import _ from 'lodash';
import Promise from 'bluebird';

import UserRoleAddDialog from './dialogs/UserRoleAddDialog.jsx';
import UsersEditDialog from './dialogs/UsersEditDialog.jsx';
import DistrictEditDialog from './dialogs/DistrictEditDialog.jsx';

import * as Action from '../actionTypes';
import * as Api from '../api';
import * as Constant from '../constants';
import store from '../store';

import CheckboxControl from '../components/CheckboxControl.jsx';
import ColDisplay from '../components/ColDisplay.jsx';
import DateControl from '../components/DateControl.jsx';
import OverlayTrigger from '../components/OverlayTrigger.jsx';
import SortTable from '../components/SortTable.jsx';
import Spinner from '../components/Spinner.jsx';
import Confirm from '../components/Confirm.jsx';
import TableControl from '../components/TableControl.jsx';

import { daysFromToday, formatDateTime, today, isValidDate, toZuluTime } from '../utils/date';
import { isBlank, notBlank } from '../utils/string';


var UsersDetail = React.createClass({
  propTypes: {
    currentUser: React.PropTypes.object,
    user: React.PropTypes.object,
    ui: React.PropTypes.object,
    rentalConditions: React.PropTypes.object,
    userDistricts: React.PropTypes.object,
    districts: React.PropTypes.object,
    params: React.PropTypes.object,
    router: React.PropTypes.object,
  },

  getInitialState() {
    return {
      loading: true,

      district: {},

      showEditDialog: false,
      showUserRoleDialog: false,
      showDistrictEditDialog: false,

      ui: {
        // User roles
        sortField: this.props.ui.sortField || 'roleName',
        sortDesc: this.props.ui.sortDesc === true,
        showExpiredOnly: false,
      },
    };
  },

  componentDidMount() {
    // if new user
    if (this.props.params.userId === '0') {
      // Clear the user store
      store.dispatch({ type: Action.UPDATE_USER, user: {
        id: 0,
        active: true,
        district: { id: 0, name: '' },
        groupIds: [],

      }});
      // Open editor to add new user
      this.openEditDialog();
    } else {
      this.fetch();
    }
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.params.userId !== nextProps.params.userId) {
      this.fetch();
    }
  },

  fetch() {
    this.setState({ loading: true });
    var getUserPromise = Api.getUser(this.props.params.userId);
    var getUserDistrictsPromise = Api.getUserDistricts(this.props.params.userId);
    Promise.all([getUserPromise, getUserDistrictsPromise]).finally(() => {
      this.setState({ loading: false });
    });
  },

  updateUIState(state, callback) {
    this.setState({ ui: { ...this.state.ui, ...state }}, () =>{
      store.dispatch({ type: Action.UPDATE_USER_ROLES_UI, userRoles: this.state.ui });
      if (callback) { callback(); }
    });
  },

  openEditDialog() {
    this.setState({ showEditDialog: true });
  },

  closeEditDialog() {
    this.setState({ showEditDialog: false });
  },

  onSaveEdit(user) {
    var savePromise = this.props.params.userId ? Api.updateUser : Api.addUser;
    savePromise(user).then(() => {
      if (!this.props.params.userId) {
        // Make sure we get the new user's ID
        user.id = this.props.user.id;
        // Reload the screen using new user id
        this.props.router.push({
          pathname: `${ Constant.USERS_PATHNAME }/${ user.id }`,
        });
      }
    });
    this.closeEditDialog();
  },

  onCloseEdit() {
    this.closeEditDialog();
    if (this.props.params.userId === '0') {
      // Go back to user list if cancelling new user
      this.props.router.push({
        pathname: Constant.USERS_PATHNAME,
      });
    }
  },

  openUserRoleDialog() {
    this.setState({ showUserRoleDialog: true });
  },

  closeUserRoleDialog() {
    this.setState({ showUserRoleDialog: false });
  },

  addUserRole(userRole) {
    Api.addUserRole(this.props.user.id, userRole);
    this.closeUserRoleDialog();
  },

  updateUserRole(userRole) {
    // The API call updates all of the user's user roles so we have to
    // include them all in this call, modifying the one that has just
    // been expired.
    var userRoles = this.props.user.userRoles.map(ur => {
      return {
        roleId: ur.roleId,
        effectiveDate: ur.effectiveDate,
        expiryDate: userRole.id === ur.id ? userRole.expiryDate : ur.expiryDate,
      };
    });

    Api.updateUserRoles(this.props.user.id, userRoles);
    this.closeUserRoleDialog();
  },

  print() {
    window.print();
  },

  openDistrictEditDialog() {
    this.setState({ showDistrictEditDialog: true });
  },

  closeDistrictEditDialog() {
    this.setState({ showDistrictEditDialog: false });
  },

  addUserDistrict() {
    this.setState({ district: { id: 0 }, showDistrictEditDialog: true });
  },

  editUserDistrict(district) {
    this.setState({ district, showDistrictEditDialog: true });
  },

  saveDistrict(district) {
    var isNew = district.id === 0;
    var promise;
    isNew ? promise =  Api.addUserDistrict(district) : promise = Api.editUserDistrict(district);
    promise.then((response) => {
      if (district.user.id === this.props.currentUser.id) {
        this.updateCurrentUserDistricts(response.data);
      }
      this.closeDistrictEditDialog();
    }); 
  },

  deleteDistrict(district) {
    Api.deleteUserDistrict(district).then((response) => {
      if (district.user.id === this.props.currentUser.id) {
        this.updateCurrentUserDistricts(response.data);
      }
    });
  },

  updateCurrentUserDistricts(districts) {
    store.dispatch({ type: Action.CURRENT_USER_DISTRICTS, currentUserDistricts: districts });
  },

  render() {
    var user = this.props.user;

    if (!this.props.currentUser.hasPermission(Constant.PERMISSION_USER_MANAGEMENT) && !this.props.currentUser.hasPermission(Constant.PERMISSION_ADMIN)) { 
      return (
        <div>You do not have permission to view this page.</div>
      ); 
    }

    return <div id="users-detail">
      <div>
        <Row id="users-top">
          <Col sm={8}>
            <Label bsStyle={ user.active ? 'success' : 'danger'}>{ user.active ? 'Verified Active' : 'Inactive' }</Label>
          </Col>
          <Col sm={4}>
            <div className="pull-right">
              <Button onClick={ this.print }><Glyphicon glyph="print" title="Print" /></Button>
              <LinkContainer to={{ pathname: Constant.USERS_PATHNAME }}>
                <Button title="Return"><Glyphicon glyph="arrow-left" /> Return</Button>
              </LinkContainer>
            </div>
          </Col>
        </Row>

        {(() => {
          if (this.state.loading) { return <div style={{ textAlign: 'center' }}><Spinner/></div>; }

          return <div id="users-header">
            <Row>
              <Col md={12}>
                <h1>User: <small>{ user.fullName }</small></h1>
              </Col>
            </Row>
          </div>;
        })()}
        <Row>
          <Col md={12}>
            <Well>
              <h3>General <span className="pull-right"><Button title="Edit User" bsSize="small" onClick={ this.openEditDialog }><Glyphicon glyph="pencil" /></Button></span></h3>
              {(() => {
                if (this.state.loading) { return <div style={{ textAlign: 'center' }}><Spinner/></div>; }

                return <Row id="user-data">
                  <Col lg={4} md={6} sm={12} xs={12}>
                    <ColDisplay labelProps={{ xs: 4 }} fieldProps={{ xs: 8 }} label="Given Name">{ user.givenName }</ColDisplay>
                  </Col>
                  <Col lg={4} md={6} sm={12} xs={12}>
                    <ColDisplay labelProps={{ xs: 4 }} fieldProps={{ xs: 8 }} label="Surname">{ user.surname }</ColDisplay>
                  </Col>
                  <Col lg={4} md={6} sm={12} xs={12}>
                    <ColDisplay labelProps={{ xs: 4 }} fieldProps={{ xs: 8 }} label="User ID">{ user.smUserId }</ColDisplay>
                  </Col>
                  <Col lg={4} md={6} sm={12} xs={12}>
                    <ColDisplay labelProps={{ xs: 4 }} fieldProps={{ xs: 8 }} label="E-mail">{ user.email }</ColDisplay>
                  </Col>
                  <Col lg={4} md={6} sm={12} xs={12}>
                    <ColDisplay labelProps={{ xs: 4 }} fieldProps={{ xs: 8 }} label="District">{ user.districtName }</ColDisplay>
                  </Col>
                </Row>;
              })()}
            </Well>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Well>
              <h3>Districts</h3>
              {(() => {
                var addDistrictButton = <Button title="Add District" bsSize="small" onClick={ this.addUserDistrict }><Glyphicon glyph="plus" />&nbsp;<strong>Add District</strong></Button>;
                
                if (this.props.userDistricts.loading) { return <div style={{ textAlign: 'center' }}><Spinner/></div>; }

                if (this.props.userDistricts.data.length === 0) { return <Alert bsStyle="success">No Districts { addDistrictButton }</Alert>; }

                return (
                  <TableControl headers={[
                    { field: 'name',         title: 'District Name'  },
                    { field: 'addCondition', title: 'Add Condition',  style: { textAlign: 'right'  },
                      node: addDistrictButton,
                    },
                  ]}>
                    {
                      _.map(this.props.userDistricts.data, (district) => {
                        return <tr key={ district.id }>
                          <td>{ district.isPrimary && <Glyphicon glyph="star" /> }{ district.district.name }</td>
                          <td style={{ textAlign: 'right' }}>
                            { !district.isPrimary && 
                              <ButtonGroup>
                                <OverlayTrigger trigger="click" placement="top" rootClose overlay={ <Confirm onConfirm={ this.deleteDistrict.bind(this, district) } /> }>
                                  <Button title="Delete District" bsSize="xsmall"><Glyphicon glyph="trash" /></Button>
                                </OverlayTrigger>
                                <Button title="Edit District" bsSize="xsmall" onClick={ this.editUserDistrict.bind(this, district) }><Glyphicon glyph="edit" /></Button>
                              </ButtonGroup>
                            }
                          </td>
                        </tr>;
                      })
                    }
                  </TableControl>
                );
              })()}
            </Well>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Well id="users-access">
              <h3>Access
                <CheckboxControl inline id="showExpiredOnly" checked={ this.state.ui.showExpiredOnly } updateState={ this.updateUIState }>Show Expired Only</CheckboxControl>
              </h3>
              {(() => {
                if (this.state.loading ) { return <div style={{ textAlign: 'center' }}><Spinner/></div>; }

                var addUserRoleButton = <Button title="Add User Role" onClick={ this.openUserRoleDialog } bsSize="xsmall"><Glyphicon glyph="plus" />&nbsp;<strong>Add Role</strong></Button>;

                var userRoles = _.filter(user.userRoles, userRole => {
                  var include = notBlank(userRole.roleName);
                  if (this.state.ui.showExpiredOnly) {
                    include = include && userRole.expiryDate && daysFromToday(userRole.expiryDate) < 0;
                  }
                  return include;
                });
                if (userRoles.length === 0) { return <Alert bsStyle="success">No roles { addUserRoleButton }</Alert>; }

                userRoles = _.sortBy(userRoles, this.state.ui.sortField);
                if (this.state.ui.sortDesc) {
                  _.reverse(userRoles);
                }

                var headers = [
                  { field: 'roleName',          title: 'Role'           },
                  { field: 'effectiveDateSort', title: 'Effective Date' },
                  { field: 'expiryDateSort',    title: 'Expiry Date'    },
                  { field: 'addUserRole',       title: 'Add User Role', style: { textAlign: 'right'  },
                    node: addUserRoleButton,
                  },
                ];

                return <SortTable id="user-roles-list" sortField={ this.state.ui.sortField } sortDesc={ this.state.ui.sortDesc } onSort={ this.updateUIState } headers={ headers }>
                  {
                    _.map(userRoles, (userRole) => {
                      return <tr key={ userRole.id }>
                        <td>{ userRole.roleName }</td>
                        <td>{ formatDateTime(userRole.effectiveDate, Constant.DATE_FULL_MONTH_DAY_YEAR) }</td>
                        <td>{ formatDateTime(userRole.expiryDate, Constant.DATE_FULL_MONTH_DAY_YEAR) }
                          &nbsp;{ daysFromToday(userRole.expiryDate) < 0 ? <Glyphicon glyph="asterisk" /> : '' }
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {
                            userRole.expiryDate ? null :
                              <OverlayTrigger trigger="click" placement="left" rootClose
                                overlay={ <ExpireOverlay userRole={ userRole } onSave={ this.updateUserRole }/> }
                              >
                                <Button title="Expire User Role" bsSize="xsmall"><Glyphicon glyph="pencil" />&nbsp;Expire</Button>
                              </OverlayTrigger>
                          }
                        </td>
                      </tr>;
                    })
                  }
                </SortTable>;
              })()}
            </Well>
          </Col>
        </Row>
      </div>
      { this.state.showEditDialog &&
        <UsersEditDialog 
          show={ this.state.showEditDialog } 
          onSave={ this.onSaveEdit } 
          onClose= { this.onCloseEdit } 
        />
      }
      { this.state.showUserRoleDialog &&
        <UserRoleAddDialog 
          show={ this.state.showUserRoleDialog } 
          onSave={ this.addUserRole } 
          onClose={ this.closeUserRoleDialog } 
        />
      }
      { this.state.showDistrictEditDialog && 
        <DistrictEditDialog 
          show={ this.state.showDistrictEditDialog } 
          onSave={ this.saveDistrict } 
          onClose={ this.closeDistrictEditDialog }
          districts={ this.props.districts } 
          user={ this.props.user }
          district={ this.state.district }
          userDistricts={ this.props.userDistricts.data }
        />
      }
    </div>;
  },
});


var ExpireOverlay = React.createClass({
  propTypes: {
    userRole: React.PropTypes.object.isRequired,
    onSave: React.PropTypes.func.isRequired,
    hide: React.PropTypes.func,
  },

  getInitialState() {
    return {
      expiryDate: today(),
      expiryDateError: '',
    };
  },

  updateState(state, callback) {
    this.setState(state, callback);
  },

  saveUserRole() {
    this.setState({ expiryDateError: false });

    if (isBlank(this.state.expiryDate)) {
      this.setState({ expiryDateError: 'Expiry date is required' });
    } else if (!isValidDate(this.state.expiryDate)) {
      this.setState({ expiryDateError: 'Expiry date not valid' });
    } else {
      this.props.onSave({ ...this.props.userRole, ...{
        expiryDate: toZuluTime(this.state.expiryDate),
        roleId: this.props.userRole.role.id,
      }});
      this.props.hide();
    }
  },

  render() {
    var props = _.omit(this.props, 'onSave', 'hide', 'userRole');
    return <Popover id="users-role-popover" title="Set Expiry Date" { ...props }>
      <Form inline>
        <FormGroup controlId="expiryDate" validationState={ this.state.expiryDateError ? 'error' : null }>
          <DateControl id="expiryDate" date={ this.state.expiryDate } updateState={ this.updateState } placeholder="mm/dd/yyyy" title="Expiry Date"/>
          <HelpBlock>{ this.state.expiryDateError }</HelpBlock>
        </FormGroup>
        <Button bsStyle="primary" onClick={ this.saveUserRole } className="pull-right">Save</Button>
      </Form>
    </Popover>;
  },
});



function mapStateToProps(state) {
  return {
    currentUser: state.user,
    user: state.models.user,
    ui: state.ui.userRoles,
    rentalConditions: state.lookups.rentalConditions,
    userDistricts: state.models.userDistricts,
    districts: state.lookups.districts,    
  };
}

export default connect(mapStateToProps)(UsersDetail);
