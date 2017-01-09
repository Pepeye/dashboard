import faunadb from 'faunadb';
const q = faunadb.query, Ref = q.Ref;

import ClassInfo from './Classes'
export { ClassInfo }

// Actions
export const ClassesActions = {
  UPDATE_CLASS_INFO: "UPDATE_CLASS_INFO",
  UPDATE_SELECTED_CLASS: "UPDATE_SELECTED_CLASS",
  FETCHING_CLASSES: "FETCHING_CLASSES",
  UPDATE_INDEX_OF_CLASS: "UPDATE_INDEX_OF_CLASS"
}

export function updateClassInfo(result) {
  if(!Array.isArray(result))
    result = [result]

  return {
    type: ClassesActions.UPDATE_CLASS_INFO,
    result: result
  }
}

export function updateSelectedClass(name) {
  return {
    type: ClassesActions.UPDATE_SELECTED_CLASS,
    name: name
  }
}

export function fetchingClasses(fetching) {
  return {
    type: ClassesActions.FETCHING_CLASSES,
    fetching: fetching
  }
}

export function getAllClasses(client) {
  return (dispatch, getState) => {
    const classes = getState().classes

    if(classes.fetchingData || Object.keys(classes.byName || {}).length > 0)
      return Promise.resolve()

    dispatch(fetchingClasses(true))

    return client.query(q.Map(q.Paginate(Ref("classes")), clazz => q.Get(clazz)))
      .then(result => dispatch(updateClassInfo(result.data)))
      .then(() => dispatch(fetchingClasses(false)))
  }
}

export function updateIndexOfClass(clazz, indexes) {
  return {
    type: ClassesActions.UPDATE_INDEX_OF_CLASS,
    clazz: clazz,
    indexes: indexes
  }
}

export function queryForIndexes(client, classRef) {
  return (dispatch, getState) => {
    const name = classRef.id
    const classes = getState().classes

    if(classes && classes.indexes && classes.indexes[name]) {
      return Promise.resolve()
    }

    const allIndexes = q.Filter(
      q.Map(q.Paginate(Ref("indexes")), indexRef => q.Get(indexRef)),
      indexInstance => {
        return q.If(q.Contains("source", indexInstance),
          q.Equals(classRef, q.Select("source", indexInstance)),
          true
        )
      }
    )

    return client.query(q.Map(allIndexes, index => q.Select(['name'], index)))
      .then(result => dispatch(updateIndexOfClass(name, result.data)))
  }
}

// Reducers

/*
  Shape of data

  classes: {
    byName: {
      "class-0": {},
      "class-1": {}
    },
    indexes: {
      "class-0": ["index-0", "index-1"],
      "class-1": ["index-1"]
    },
    selectedClass: "class-0",
    fecthingData: true
  }

*/

export function reduceClasses(state = {}, action) {
  switch(action.type) {
    case ClassesActions.UPDATE_CLASS_INFO: {
      var byName = state.byName

      action.result.forEach(clazz => {
        byName = {...byName,
          [clazz.name]: {
            classInfo: clazz
          }
        }
      })
      return {...state, byName: byName}
    }

    case ClassesActions.UPDATE_SELECTED_CLASS:
      return {...state, selectedClass: action.name}

    case ClassesActions.UPDATE_INDEX_OF_CLASS: {
      const indexes = {...state.indexes, [action.clazz]: [...action.indexes]}
      return {...state, indexes: indexes}
    }

    case ClassesActions.FETCHING_CLASSES:
      return {...state, fetchingData: action.fetching}

    default:
      return state
  }
}
