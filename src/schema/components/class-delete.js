import React from "react"
import { connect } from "react-redux"
import { browserHistory } from "react-router"

import DeleteForm from "./delete-form"
import { deleteClass, selectedDatabase, selectedClass } from "../"
import { notify } from "../../notifications"
import { faunaClient } from "../../authentication"
import { buildResourceUrl } from "../../router"

const ClassDelete = ({ client, path, dbUrl, clazz }) => {
  const onDelete = () => {
    return notify("Class deleted successfully", dispatch =>
      dispatch(deleteClass(client, path, clazz.get("name"))).then(() =>
        browserHistory.push(buildResourceUrl(dbUrl, "classes"))
      )
    )
  }

  return <DeleteForm
    buttonText="Delete Class"
    type="class"
    title={`Delete ${clazz.get("name")}`}
    validateName={clazz.get("name")}
    onDelete={onDelete} />
}

export default connect(
  (state, props) => ({
    client: faunaClient(state),
    path: selectedDatabase(state).get("path"),
    dbUrl: selectedDatabase(state).get("url"),
    clazz: selectedClass(state),
    ...props
  })
)(ClassDelete)
