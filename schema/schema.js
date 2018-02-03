const graphql = require('graphql');
const axios = require('axios');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;


const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString},
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(resp => resp.data);
      }
    },
    friends: { 
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return parentValue.friends.map(id => axios.get(`http://localhost:3000/users/${id}`)
          .then(res => res.data));
      } 
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/users/${args.id}`)
          .then(resp => resp.data);
      }
    },
    company: {
      type: CompanyType,
        args: { id: { type: GraphQLString } },
        resolve(parentValue, args) {
          return axios.get(`http://localhost:3000/companies/${args.id}`)
            .then(resp => resp.data);
      }
    }
  }
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios.post('http://localhost:3000/users', { firstName, age })
          .then(res => res.data)
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { id }) {
        return axios.delete(`http://localhost:3000/users/${id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
          .then(res => res.data);
      }
    },
    addFriends: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        addId: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parentValue, { id, addId }) {
        const user = await axios.get(`http://localhost:3000/users/${id}`).then(res => res.data);
        const user2 = await axios.get(`http://localhost:3000/users/${addId}`).then(res => res.data);
        const newFriendsList = user.friends.includes(addId) ? [...user.friends] : [...user.friends, addId];
        const newFriendsList2 = user2.friends.includes(id) ? [...user2.friends] : [...user2.friends, id];
        axios.patch(`http://localhost:3000/users/${addId}`, { friends: newFriendsList2 })
          .then(res => res.data);
        return axios.patch(`http://localhost:3000/users/${id}`, { friends: newFriendsList })
          .then(res => res.data);
      }
    },
    removeFriend: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        removeId: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parentValue, { id, removeId }) {
        const user = await axios.get(`http://localhost:3000/users/${id}`).then(res => res.data);
        const user2 = await axios.get(`http://localhost:3000/users/${removeId}`).then(res => res.data);
        const newFriendsList = user.friends.includes(removeId) ? user.friends.filter(id => id !== removeId) : [...user.friends];
        const newFriendsList2 = user2.friends.includes(id) ? user2.friends.filter(x => x !== id) : [...user2.friends];
        axios.patch(`http://localhost:3000/users/${removeId}`, { friends: newFriendsList2 })
          .then(res => res.data);
        return axios.patch(`http://localhost:3000/users/${id}`, { friends: newFriendsList })
          .then(res => res.data);
      } 
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});