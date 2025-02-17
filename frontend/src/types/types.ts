export interface candleStickData {
  symbol: string;
  interval: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  trades: number;
  final_kline: boolean;
}
