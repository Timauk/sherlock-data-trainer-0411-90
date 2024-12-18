import { Player } from '@/types/gameTypes';

export interface PlayerCardProps {
  player: Player;
  isTopPlayer: boolean;
  onPlayerClick: (player: Player) => void;
  onClonePlayer: (player: Player, e: React.MouseEvent) => void;
}

export interface PlayerListProps {
  players: Player[];
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
  onClonePlayer?: (player: Player) => void;
}

export interface PlayerWeightsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  editedWeights: Weight[];
  onWeightChange: (index: number, value: number) => void;
  onClonePlayer: (player: Player) => void;
}

export interface Weight {
  name: string;
  value: number;
  description: string;
}