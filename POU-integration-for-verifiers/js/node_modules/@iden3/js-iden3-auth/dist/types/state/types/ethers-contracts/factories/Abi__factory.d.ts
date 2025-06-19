import { Signer } from 'ethers';
import type { Provider } from '@ethersproject/providers';
import type { Abi, AbiInterface } from '../Abi';
export declare class Abi__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint8";
            readonly name: "version";
            readonly type: "uint8";
        }];
        readonly name: "Initialized";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "previousOwner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "newOwner";
            readonly type: "address";
        }];
        readonly name: "OwnershipTransferStarted";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "previousOwner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "newOwner";
            readonly type: "address";
        }];
        readonly name: "OwnershipTransferred";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "blockN";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "state";
            readonly type: "uint256";
        }];
        readonly name: "StateUpdated";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "VERSION";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "acceptOwnership";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "getGISTProof";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "existence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256[64]";
                readonly name: "siblings";
                readonly type: "uint256[64]";
            }, {
                readonly internalType: "uint256";
                readonly name: "index";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "auxExistence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxIndex";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxValue";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistProof";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "blockNumber";
            readonly type: "uint256";
        }];
        readonly name: "getGISTProofByBlock";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "existence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256[64]";
                readonly name: "siblings";
                readonly type: "uint256[64]";
            }, {
                readonly internalType: "uint256";
                readonly name: "index";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "auxExistence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxIndex";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxValue";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistProof";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "root";
            readonly type: "uint256";
        }];
        readonly name: "getGISTProofByRoot";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "existence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256[64]";
                readonly name: "siblings";
                readonly type: "uint256[64]";
            }, {
                readonly internalType: "uint256";
                readonly name: "index";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "auxExistence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxIndex";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxValue";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistProof";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }];
        readonly name: "getGISTProofByTime";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "existence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256[64]";
                readonly name: "siblings";
                readonly type: "uint256[64]";
            }, {
                readonly internalType: "uint256";
                readonly name: "index";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly internalType: "bool";
                readonly name: "auxExistence";
                readonly type: "bool";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxIndex";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "auxValue";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistProof";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getGISTRoot";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "start";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "length";
            readonly type: "uint256";
        }];
        readonly name: "getGISTRootHistory";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByRoot";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistRootInfo[]";
            readonly name: "";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getGISTRootHistoryLength";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "root";
            readonly type: "uint256";
        }];
        readonly name: "getGISTRootInfo";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByRoot";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistRootInfo";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "blockNumber";
            readonly type: "uint256";
        }];
        readonly name: "getGISTRootInfoByBlock";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByRoot";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistRootInfo";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }];
        readonly name: "getGISTRootInfoByTime";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "root";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByRoot";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.GistRootInfo";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "getStateInfoById";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "id";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "state";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByState";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.StateInfo";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "state";
            readonly type: "uint256";
        }];
        readonly name: "getStateInfoByIdAndState";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "id";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "state";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByState";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.StateInfo";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "startIndex";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "length";
            readonly type: "uint256";
        }];
        readonly name: "getStateInfoHistoryById";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "id";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "state";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedByState";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtTimestamp";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "createdAtBlock";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "replacedAtBlock";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IState.StateInfo[]";
            readonly name: "";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "getStateInfoHistoryLengthById";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getVerifier";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "idExists";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract IStateTransitionVerifier";
            readonly name: "verifierContractAddr";
            readonly type: "address";
        }];
        readonly name: "initialize";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "owner";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "pendingOwner";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "renounceOwnership";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newVerifierAddr";
            readonly type: "address";
        }];
        readonly name: "setVerifier";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "state";
            readonly type: "uint256";
        }];
        readonly name: "stateExists";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newOwner";
            readonly type: "address";
        }];
        readonly name: "transferOwnership";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "oldState";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "newState";
            readonly type: "uint256";
        }, {
            readonly internalType: "bool";
            readonly name: "isOldStateGenesis";
            readonly type: "bool";
        }, {
            readonly internalType: "uint256[2]";
            readonly name: "a";
            readonly type: "uint256[2]";
        }, {
            readonly internalType: "uint256[2][2]";
            readonly name: "b";
            readonly type: "uint256[2][2]";
        }, {
            readonly internalType: "uint256[2]";
            readonly name: "c";
            readonly type: "uint256[2]";
        }];
        readonly name: "transitState";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): AbiInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Abi;
}
