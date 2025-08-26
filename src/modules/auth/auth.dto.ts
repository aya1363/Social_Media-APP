export interface ISignupBodyInputs {
    userName: string,
    email: string,
    password?: string,
}

export interface ILoginBodyInputs{
    email: string,
    password: string,
}

export interface IConfirmEmailBodyInputs{
   
    email: string,
    otp: string,
}