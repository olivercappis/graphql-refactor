const { User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
    Query: {
        // Get all users
        users: async () => {
            return User.find().populate('savedBooks');
        },
        // Get a single user by username
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('savedBooks');
        },
        // Get the currently authenticated user
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    },

    Mutation: {
        // Add a new user
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },

        // User login
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },

        // Save a book to the user's savedBooks array
        saveBook: async (parent, { bookId, title, description, image, link }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    {
                        $addToSet: {
                            savedBooks: { bookId, title, description, image, link }
                        }
                    },
                    { new: true }
                ).populate('savedBooks');

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;
