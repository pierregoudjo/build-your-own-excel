export type Position = [string, number]
export type BinaryOperation = [Expression, Operator, Expression]
export type Operator = "+" | "*" | "-" | "/"
export type Reference = Position

export type Expression = 
  | Value
  | BinaryOperation 
  | Reference

export type Value = number