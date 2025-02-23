"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Territory, TerritoryTypes } from "./type";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronFirst,
  ChevronLast,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  MapIcon,
  PenIcon,
  TrashIcon,
  EyeIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { TerritoryFilter } from "@/components/TerritoryFilter";

const axios = new AxiosAdapter();
interface ClientSideTerritoryProps {
  territories: Territory[];
  pagination: {
    limit: number;
    page: number;
    total: number;
  };
  territoryTypes: TerritoryTypes[];
}
export function ClientSideTerritory({
  territories: territoriesRaw,
  pagination,
  territoryTypes,
}: ClientSideTerritoryProps) {
  const [editMode, setEditMode] = useState<number>(0);
  const [deleteMode, setDeleteMode] = useState<number>(0);
  const [territories, setTerritories] = useState<Territory[]>(territoriesRaw);
  const router = useRouter();

  const totalPage = Math.ceil(pagination.total / pagination.limit);

  useEffect(() => {
    setTerritories(territoriesRaw);
  }, [territoriesRaw]);

  const handleEditMode = (value: number) => {
    if (editMode === value) {
      setEditMode(0);
      return;
    }
    setEditMode(value);
  };

  const updateTerritoryName = (value: string, territoryId: number) => {
    setTerritories((prev) =>
      prev.map((item) =>
        item.id === territoryId ? { ...item, name: value } : item
      )
    );
  };
  const updateTerritoryType = (value: number, territoryId: number) => {
    setTerritories((prev) =>
      prev.map((item) => {
        if (item.id === territoryId) {
          const newType = territoryTypes.find((type) => type.id === value);
          if (!newType) {
            return item;
          }
          return {
            ...item,
            typeId: value,
            type: newType,
          };
        }
        return item;
      })
    );
  };

  const submitUpdate = async (territoryId: number) => {
    const territory = territories.find((item) => item.id === territoryId);
    if (!territory) {
      return;
    }
    const { status, message } = await axios.put(`territories/${territoryId}`, {
      name: territory.name,
      typeId: territory.typeId,
      id: territory.id
    });
    if (status > 299) {
      console.error(message);
      return;
    }
    setEditMode(0);
  };

  const submitDelete = async (territoryId: number) => {
    setDeleteMode((prev) => prev === territoryId ? 0 : territoryId);
  }

  const handlePage = (page: number) => {
    const newPage = pagination.page + page;
    if (newPage < 1 || newPage > totalPage) {
      return;
    }
    router.push(`/cadastro/territorio?page=${newPage}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('search', value);
    router.push(`/cadastro/territorio?${params.toString()}`);
  }

  const setTabValue = (value: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('type', String(value));
    router.push(`/cadastro/territorio?${params.toString()}`);
  }

  return (
    <>
      <TerritoryFilter
        className="rounded-md shadow-md rounded-b-none bg-white my-4 p-4"
        title="Territórios"
        onSearch={(e) => handleSearch(e.target.value)}
        onTabChange={(e) => setTabValue(+e)}
        selectedBlock={[
          { value: "1", label: "Quadra 1" },
          { value: "2", label: "Quadra 2" },
          { value: "3", label: "Quadra 3" },
        ]}
        tabs={territoryTypes.map((type) => ({
          value: String(type.id),
          label: type.name,
        }))}
      >
        {/* <AddBlock /> */}
      </TerritoryFilter>
      <Table className="rounded-md shadow-md rounded-b-none bg-white">
        <TableCaption className="w-full bg-white p-2 rounded-md rounded-t-none shadow-md mt-0.5">
          <div className="flex justify-between">
            <div className="flex items-center">
              {pagination.page} de {totalPage}
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="p-2 mr-1"
                variant="outline"
                onClick={() => router.push("/cadastro/territorio?page=1")}
                disabled={pagination.page === 1}
              >
                <ChevronFirst />
              </Button>
              <Button
                className="p-2"
                variant="outline"
                onClick={() => handlePage(-1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft />
              </Button>
              <Button
                className="p-2"
                variant="outline"
                onClick={() => handlePage(1)}
                disabled={pagination.page === totalPage}
              >
                <ChevronRight />
              </Button>
              <Button
                className="p-2 ml-1"
                variant="outline"
                onClick={() =>
                  router.push(`/cadastro/territorio?page=${totalPage}`)
                }
                disabled={pagination.page === totalPage}
              >
                <ChevronLast />
              </Button>
            </div>
          </div>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Territorio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Mapa</TableHead>
            <TableHead className="flex items-center justify-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {territories.map((territory) => {
            return (
              <TableRow key={territory.id}>
                <CellTerritoryName
                  isEditMode={territory.id === editMode}
                  name={territory.name}
                  updateName={(value) =>
                    updateTerritoryName(value, territory.id)
                  }
                />
                <CellTerritoryType
                  isEditMode={territory.id === editMode}
                  typeName={territory.type.name}
                  typeId={territory.typeId}
                  updateType={(value) =>
                    updateTerritoryType(value, territory.id)
                  }
                  territoryTypes={territoryTypes}
                />
                <CellTerritoryImage
                  imageUrl={territory.imageUrl}
                  name={territory.name}
                />
                <CellTerritoryAction
                  actions={[
                    {
                      toggleMode: editMode === territory.id,
                      setToggleMode: () => handleEditMode(territory.id),
                      submitAction: () => submitUpdate(territory.id),
                      icon: {
                        jsx: <CheckIcon />,
                        className: "text-green-500 hover:text-green-700"
                      },
                      secondaryIcon: {
                        jsx: <PenIcon />,
                        className: "text-blue-500 hover:text-blue-700"
                      }
                    },
                    {
                      toggleMode: deleteMode === territory.id,
                      setToggleMode: () => setDeleteMode(territory.id),
                      submitAction: () => submitDelete(territory.id),
                      icon: {
                        jsx: <CheckIcon />,
                        className: "text-green-500 hover:text-green-700"
                      },
                      secondaryIcon: {
                        jsx: <TrashIcon />,
                        className: "text-red-500 hover:text-red-700"
                      }
                    },
                    {
                      toggleMode: false,
                      setToggleMode: () => {
                        router.push(`/cadastro/territorio/${territory.id}`);
                      },
                      submitAction: () => {
                        router.push(`/cadastro/territorio/${territory.id}`);
                      },
                      icon: {
                        jsx: <EyeIcon />,
                        className: "text-yellow-500 hover:text-yellow-700"
                      },
                      secondaryIcon: {
                        jsx: <EyeIcon />,
                        className: "text-yellow-500 hover:text-yellow-700"
                      }
                    }
                  ]}
                />

              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

// interface Block {
//   id: string | undefined;
//   name: string;
// }
// interface Address {
//   id: string;
//   street: string;
//   zip_code: string;
// }
// function AddBlock() {
//   const [open, setOpen] = useState(false);
//   const [block, setBlock] = useState<Block>({
//     id: undefined,
//     name: "",
//   });
//   const [addresses, setAddresses] = useState<Address[]>([]);
//   const alreadyExistsAnGhostStreet = addresses.some((address) => address.street === "" || address.zip_code === "");

//   const handleAddAddress = () => {
//     if (alreadyExistsAnGhostStreet) {
//       return;
//     }

//     const uuid = crypto.randomUUID();
//     const address: Address = {
//       id: "temp-" + uuid,
//       street: "",
//       zip_code: "",
//     }
//     setAddresses([...addresses, address]);
//   }

//   const removeAddress = (address: Address) => {
//     setAddresses((prev) => prev.filter((item) => {
//       return item.id !== address.id;
//     }))
//   }

//   const updateAddress = (street: Address) => {
//     setAddresses((prev) => prev.map((item) => {
//       if (street.id === item.id) {
//         return street;
//       }
//       return item;
//     }))
//   }

//   const handleSubmit = () => {
//     const addressesToSave = addresses.map((address) => {
//       if (address.id.startsWith("temp-")) {
//         return {
//           ...address,
//           id: undefined,
//         }
//       }
//       return address;
//     });
//     const body = {
//       block,
//       ...(addressesToSave?.length > 0 ? { addresses: addressesToSave } : {}),
//     }
//     console.log(JSON.stringify(body, null, 2));

//     setOpen(false);
//   }

//   const canSubmit = (addresses?.length > 0 ? addresses.some((address) => address.street !== "" || address.zip_code !== "") : true) && block.name !== "";
//   return (
//     <>
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogTrigger asChild>
//           <Button>{block.id ? "Editar" : "Adicionar"} quadra</Button>
//         </DialogTrigger>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{block.id ? "Editar" : "Cadastrar"} quadra</DialogTitle>
//           </DialogHeader>
//           <div className="flex flex-col gap-4">
//             <Label>
//               <span className="text-sm font-medium">Nome do quadra</span>
//               <Input type="text" placeholder="Digitar nome da quadra" list="street" value={block.name} onChange={(e) => setBlock({ ...block, name: e.target.value })} />
//             </Label>

//             <Separator className="border-b-2 border-b-gray-200" />

//             <div className="flex flex-col gap-2">
//               <div className="flex justify-between items-center gap-2">
//                 <h2 className="text-lg font-medium">Ruas:</h2>
//                 <Button variant="outline" className="w-9 text-green-500" disabled={alreadyExistsAnGhostStreet} onClick={handleAddAddress}><PlusIcon /></Button>
//               </div>
//               {addresses.map((address) => {
//                 const formatZipCode = (value: string) => {
//                   const valueRaw = value.replace(/\D/g, '');
//                   return valueRaw.replace(/(\d{5})(\d{3})/, "$1-$2");
//                 }

//                 return (
//                   <div className="grid grid-cols-10 gap-3" key={address.id}>
//                     <Input type="text" placeholder="Digitar nome da rua" list="street" className="col-span-6" name="street" value={address.street} onChange={(e) => updateAddress({ ...address, [e.target.name]: e.target.value })} />
//                     <Input type="text" placeholder="CEP" className="col-span-3" name="zip_code" value={formatZipCode(address.zip_code)} onChange={(e) => updateAddress({ ...address, [e.target.name]: e.target.value })} />
//                     <Button variant="outline" className="p-2 text-red-500 col-span-1" onClick={() => removeAddress(address)}><MinusIcon /></Button>
//                   </div>
//                 )
//               })}
//             </div>
//           </div>
//           <DialogFooter>
//             <DialogClose asChild>
//               <Button variant="outline">Cancelar</Button>
//             </DialogClose>
//             <Button disabled={!canSubmit} title={!canSubmit ? "Preencha todos os campos" : ""} onClick={handleSubmit}>{block.id ? "Editar" : "Cadastrar"}</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       {/* <datalist id='street'>
//         <option value="Rua João Pessoa">12505707</option>
//         <option value="Rua Nova João Pessoa">12505708</option>
//         <option value="Rua Carlos Tomes">12606380</option>
//       </datalist> */}
//     </>
//   )
// }

interface TerritoryNameProps {
  isEditMode: boolean;
  name: string;
  updateName: (value: string) => void;
}
function CellTerritoryName({
  isEditMode,
  name,
  updateName,
}: TerritoryNameProps) {
  if (isEditMode) {
    return (
      <TableCell>
        <Input
          type="text"
          value={name}
          name="name"
          onChange={({ target }) => updateName(target.value)}
        />
      </TableCell>
    );
  }

  return <TableCell>{name}</TableCell>;
}

interface TerritoryTypeProps {
  isEditMode: boolean;
  typeName: string;
  typeId: number;
  updateType: (value: number) => void;
  territoryTypes: TerritoryTypes[];
}
function CellTerritoryType({
  isEditMode,
  typeName,
  typeId,
  updateType,
  territoryTypes,
}: TerritoryTypeProps) {
  if (isEditMode) {
    return (
      <TableCell>
        <Select
          value={String(typeId)}
          onValueChange={(value) => updateType(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={typeName} />
          </SelectTrigger>
          <SelectContent defaultValue={String(typeId)}>
            {territoryTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    );
  }

  return <TableCell>{typeName}</TableCell>;
}

interface CellTerritoryImageProps {
  imageUrl: string;
  name: string;
}
function CellTerritoryImage({ imageUrl, name }: CellTerritoryImageProps) {
  return (
    <TableCell>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <MapIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mapa {name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Image
              src={imageUrl}
              loading="lazy"
              alt={name}
              className=" max-h-[70vh]"
              width={425}
              height={425}
            />
          </div>
        </DialogContent>
      </Dialog>
    </TableCell>
  );
}

interface CellTerritoryActionProps {
  actions: {
    icon: {
      jsx: React.ReactNode
      className: string
    };
    secondaryIcon: {
      jsx: React.ReactNode
      className: string
    };
    toggleMode: boolean;
    setToggleMode: (value: boolean) => void;
    submitAction: () => void;
  }[]
}
function CellTerritoryAction({ actions }: CellTerritoryActionProps) {
  return (
    <TableCell className="flex gap-1 items-center justify-center">
      {actions.map((action, index) => {
        if (action.toggleMode) {
          return (
            <Button
              key={index}
              variant="outline"
              className={action.icon.className}
              onClick={action.submitAction}
            >
              {action.icon.jsx}
            </Button>
          );
        }
        return (
          <Button
            key={index}
            variant="outline"
            className={action.secondaryIcon.className}
            onClick={() => action.setToggleMode(true)}
          >
            {action.secondaryIcon.jsx}
          </Button>
        )
      })}
    </TableCell>
  )
}
