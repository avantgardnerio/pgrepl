export const getUsers = () => {
    return async (dispatch) => {
        const res = await fetch(`/users`);
        const users = await res.json();
        const action = gotUsers(users);
        dispatch(action);
    }
}

export const gotUsers = (users) => {
    return {
        type: 'GOT_USERS',
        users
    }
}