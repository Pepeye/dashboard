import Immutable from "immutable"
import React, { Component } from "react"
import { Provider, connect } from "react-redux"
import { Router, Route, Redirect, Link, browserHistory } from "react-router"

import "./app.css"
import logo from "./logo.svg"
import { ToggleRepl } from "./repl"
import { updateSelectedResource } from "./router"
import { ActivityMonitor, monitorActivity } from "./activity-monitor"
import { NotificationBar, watchForError } from "./notifications"
import { LoginForm, UserAccount, faunaClient } from "./authentication"
import { IntercomWidget } from "./external/intercom"

import {
  NavTree,
  DatabaseForm,
  ClassForm,
  ClassInfo,
  IndexForm,
  IndexInfo,
  loadSchemaTree
} from "./schema"

class Container extends Component {

  componentDidMount() {
    this.updateSelectedResource(
      this.props.faunaClient,
      this.props.params.splat
    )
  }

  componentWillReceiveProps(next) {
    const oldParams = Immutable.Map(this.props.params)
    const newParams = Immutable.Map(next.params)

    if (this.props.faunaClient !== next.faunaClient || !oldParams.equals(newParams)) {
      this.updateSelectedResource(
        next.faunaClient,
        next.params
      )
    }
  }

  updateSelectedResource(client, params) {
    if (!client) return

    this.props.dispatch(
      monitorActivity(
        watchForError(
          "Unexpected error while loading database. It may not exist or your key can't access it",
          (dispatch) => {
            const selected = dispatch(updateSelectedResource(params))
            return dispatch(loadSchemaTree(client, selected.get("database")))
          }
        )
      )
    )
  }

  render() {
    return <div className="ms-Fabric ms-font-m">
        <ToggleRepl>
          <div className="ms-Grid">
            <div className="ms-Grid-row header">
              <div className="ms-Grid-col ms-u-sm5 ms-u-md6 ms-u-lg3 ms-u-xl2 padding-05">
                <Link to="/"><img src={logo} alt="logo" /></Link>
              </div>
              <div className="ms-Grid-col ms-u-sm12 ms-u-md6 ms-u-lg9 ms-u-xl10 padding-05">
                <ul>
                  <li><ActivityMonitor /></li>
                  <li><a href="http://fauna.com/tutorials" target="_blank">Tutorials</a></li>
                  <li><a href="http://fauna.com/documentation" target="_blank">Documentation</a></li>
                  <li><UserAccount /></li>
                </ul>
              </div>
            </div>
            {this.props.faunaClient ?
              <div className="ms-Grid-row">
                <div className="ms-Grid-col ms-u-sm12 ms-u-md6 ms-u-lg4">
                  <NavTree />
                </div>
                <div className="ms-Grid-col ms-u-sm12 ms-u-md6 ms-u-lg8">
                  <NotificationBar />
                  {this.props.children}
                </div>
              </div> : null}
          </div>
        </ToggleRepl>
        <LoginForm />
        <IntercomWidget />
      </div>
  }
}

export default class App extends Component {

  static Container = connect(
    state => ({
      faunaClient: faunaClient(state)
    })
  )(Container)

  static NotFound = () => <h1>404.. This page is not found!</h1>

  render() {
    return <Provider store={this.props.store}>
        <Router history={browserHistory}>
          <Route path="/db" component={App.Container}>
            <Route path="indexes/:indexName" component={IndexInfo} />
            <Route path="indexes" component={IndexForm} />
            <Route path="classes/:className" component={ClassInfo} />
            <Route path="classes" component={ClassForm} />
            <Route path="**/indexes/:indexName" component={IndexInfo} />
            <Route path="**/indexes" component={IndexForm} />
            <Route path="**/classes/:className" component={ClassInfo} />
            <Route path="**/classes" component={ClassForm} />
            <Route path="**/databases" component={DatabaseForm} />
            <Route path="databases" component={DatabaseForm} />
            <Redirect from="/" to="databases" />
          </Route>
          <Redirect from="/" to="/db" />
          <Route path="*" component={App.NotFound} />
        </Router>
      </Provider>
  }
}
